import BigNumber from 'bignumber.js'
import React, { ComponentType, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput as RNTextInput, StyleSheet, Text } from 'react-native'
import { View } from 'react-native-animatable'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenEnterAmount from 'src/components/TokenEnterAmount'
import CustomHeader from 'src/components/header/CustomHeader'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import { AmountEnteredIn } from 'src/send/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useLocalToTokenAmount, useTokenToLocalAmount } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { parseInputAmount } from 'src/utils/parsing'
import { PreparedTransactionsResult, getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'

export interface ProceedArgs {
  tokenAmount: BigNumber
  localAmount: BigNumber | null
  token: TokenBalance
  amountEnteredIn: AmountEnteredIn
}

type ProceedComponentProps = Omit<ProceedArgs, 'tokenAmount'> & {
  onPressProceed(args: ProceedArgs): void
  disabled: boolean
  tokenAmount: BigNumber | null
}

interface Props {
  tokens: TokenBalance[]
  defaultToken?: TokenBalance
  prepareTransactionsResult?: PreparedTransactionsResult
  onClearPreparedTransactions(): void
  onRefreshPreparedTransactions(
    amount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ): void
  prepareTransactionError?: Error
  tokenSelectionDisabled?: boolean
  onPressProceed(args: ProceedArgs): void
  disableProceed?: boolean
  children?: React.ReactNode
  ProceedComponent: ComponentType<ProceedComponentProps>
  disableBalanceCheck?: boolean
}

const FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME = 250

export const SendProceed = ({
  tokenAmount,
  localAmount,
  token,
  amountEnteredIn,
  disabled,
  onPressProceed,
}: ProceedComponentProps) => {
  const { t } = useTranslation()
  return (
    <Button
      onPress={() =>
        tokenAmount && onPressProceed({ tokenAmount, localAmount, token, amountEnteredIn })
      }
      text={t('review')}
      style={styles.reviewButton}
      size={BtnSizes.FULL}
      disabled={disabled}
      testID="SendEnterAmount/ReviewButton"
    />
  )
}

function FeeLoading() {
  return (
    <View testID="SendEnterAmount/FeeLoading" style={styles.feeInCryptoContainer}>
      <Text style={styles.feeInCrypto}>{'≈ '}</Text>
      <SkeletonPlaceholder backgroundColor={Colors.gray2} highlightColor={Colors.white}>
        <View style={styles.feesLoadingInternal} />
      </SkeletonPlaceholder>
    </View>
  )
}

function FeePlaceholder({ feeTokenSymbol }: { feeTokenSymbol: string }) {
  return (
    <Text testID="SendEnterAmount/FeePlaceholder" style={styles.feeInCrypto}>
      ~ {feeTokenSymbol}
    </Text>
  )
}

function FeeAmount({ feeTokenId, feeAmount }: { feeTokenId: string; feeAmount: BigNumber }) {
  return (
    <>
      <View testID="SendEnterAmount/FeeInCrypto" style={styles.feeInCryptoContainer}>
        <TokenDisplay
          tokenId={feeTokenId}
          amount={feeAmount}
          showLocalAmount={false}
          showApprox={true}
          style={styles.feeInCrypto}
        />
      </View>
      <TokenDisplay tokenId={feeTokenId} amount={feeAmount} style={styles.feeInFiat} />
    </>
  )
}

function EnterAmount({
  tokens,
  defaultToken,
  prepareTransactionsResult,
  onClearPreparedTransactions,
  onRefreshPreparedTransactions,
  prepareTransactionError,
  tokenSelectionDisabled = false,
  onPressProceed,
  disableProceed = false,
  children,
  ProceedComponent,
  disableBalanceCheck = false,
}: Props) {
  const { t } = useTranslation()

  const tokenAmountInputRef = useRef<RNTextInput>(null)
  const tokenBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const [token, setToken] = useState<TokenBalance>(() => defaultToken ?? tokens[0])
  const [tokenAmountInput, setTokenAmountInput] = useState<string>('')
  const [localAmountInput, setLocalAmountInput] = useState<string>('')
  const [enteredIn, setEnteredIn] = useState<AmountEnteredIn>('token')
  // this should never be null, just adding a default to make TS happy
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD

  const onTokenPickerSelect = () => {
    tokenBottomSheetRef.current?.snapToIndex(0)
    AppAnalytics.track(SendEvents.token_dropdown_opened, {
      currentTokenId: token.tokenId,
      currentTokenAddress: token.address,
      currentNetworkId: token.networkId,
    })
  }

  const handleToggleAmountType = () => {
    setEnteredIn((prev) => (prev === 'token' ? 'local' : 'token'))
    tokenAmountInputRef.current?.blur()
  }

  const onSelectToken = (token: TokenBalance) => {
    setToken(token)
    tokenBottomSheetRef.current?.close()

    setTokenAmountInput('')
    setLocalAmountInput('')
    setEnteredIn((prev) => (token.priceUsd ? prev : 'token'))
    // NOTE: analytics is already fired by the bottom sheet, don't need one here
  }

  // @ts-ignore - the max button will be restored in the next PR
  const onMaxAmountPress = async () => {
    // eventually we may want to do something smarter here, like subtracting gas fees from the max amount if
    // this is a gas-paying token. for now, we are just showing a warning to the user prompting them to lower the amount
    // if there is not enough for gas
    setTokenAmountInput(token.balance.toFormat({ decimalSeparator }))
    setEnteredIn('token')
    tokenAmountInputRef.current?.blur()
    AppAnalytics.track(SendEvents.max_pressed, {
      tokenId: token.tokenId,
      tokenAddress: token.address,
      networkId: token.networkId,
    })
  }

  const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()
  // only allow numbers, one decimal separator, and any number of decimal places
  const localAmountRegex = new RegExp(
    `^(\\d+([${decimalSeparator}])?\\d*|[${decimalSeparator}]\\d*|[${decimalSeparator}])$`
  )
  // only allow numbers, one decimal separator
  const tokenAmountRegex = new RegExp(
    `^(?:\\d+[${decimalSeparator}]?\\d*|[${decimalSeparator}]\\d*|[${decimalSeparator}])$`
  )
  const parsedTokenAmount = useMemo(
    () => parseInputAmount(tokenAmountInput, decimalSeparator),
    [tokenAmountInput]
  )
  const parsedLocalAmount = useMemo(
    () =>
      parseInputAmount(
        localAmountInput.replaceAll(groupingSeparator, '').replace(localCurrencySymbol, ''),
        decimalSeparator
      ),
    [localAmountInput]
  )

  const tokenToLocal = useTokenToLocalAmount(parsedTokenAmount, token.tokenId)
  const localToToken = useLocalToTokenAmount(parsedLocalAmount, token.tokenId)
  const { tokenAmount, localAmount } = useMemo(() => {
    if (enteredIn === 'token') {
      setLocalAmountInput(
        tokenToLocal && tokenToLocal.gt(0)
          ? `${localCurrencySymbol}${tokenToLocal.toFormat(2)}` // automatically adds grouping separators
          : ''
      )
      return {
        tokenAmount: parsedTokenAmount,
        localAmount: tokenToLocal,
      }
    } else {
      setTokenAmountInput(
        localToToken && localToToken.gt(0)
          ? // no group separator for token amount, round to token.decimals and strip trailing zeros
            localToToken
              .toFormat(token.decimals, { decimalSeparator })
              .replace(new RegExp(`[${decimalSeparator}]?0+$`), '')
          : ''
      )
      return {
        tokenAmount: localToToken,
        localAmount: parsedLocalAmount,
      }
    }
  }, [tokenAmountInput, localAmountInput, enteredIn, token])

  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, token.networkId))

  useEffect(() => {
    onClearPreparedTransactions()

    if (
      !tokenAmount ||
      tokenAmount.isLessThanOrEqualTo(0) ||
      tokenAmount.isGreaterThan(token.balance)
    ) {
      return
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return onRefreshPreparedTransactions(tokenAmount, token, feeCurrencies)
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [tokenAmount, token])

  const isAmountLessThanBalance = tokenAmount && tokenAmount.lte(token.balance)
  const showLowerAmountError = !isAmountLessThanBalance && !disableBalanceCheck
  const showMaxAmountWarning =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'need-decrease-spend-amount-for-gas'
  const showNotEnoughBalanceForGasWarning =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
  const transactionIsPossible =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'possible' &&
    prepareTransactionsResult.transactions.length > 0

  const disabled =
    disableProceed || (disableBalanceCheck ? !!tokenAmount?.isZero() : !transactionIsPossible)

  const { tokenId: feeTokenId, symbol: feeTokenSymbol } = feeCurrency ?? feeCurrencies[0]
  let feeAmountSection = <FeeLoading />
  if (
    tokenAmountInput === '' ||
    !isAmountLessThanBalance ||
    (prepareTransactionsResult && !maxFeeAmount) ||
    prepareTransactionError
  ) {
    feeAmountSection = <FeePlaceholder feeTokenSymbol={feeTokenSymbol} />
  } else if (prepareTransactionsResult && maxFeeAmount) {
    feeAmountSection = <FeeAmount feeAmount={maxFeeAmount} feeTokenId={feeTokenId} />
  }

  const handleAmountInputChange = (value: string) => {
    if (enteredIn === 'token') {
      onTokenAmountInputChange(value)
    } else {
      onLocalAmountInputChange(value)
    }
  }

  const onTokenAmountInputChange = (value: string) => {
    if (!value) {
      setTokenAmountInput('')
      setEnteredIn('token')
    } else {
      if (value.startsWith(decimalSeparator)) {
        value = `0${value}`
      }
      if (value.match(tokenAmountRegex)) {
        setTokenAmountInput(value)
        setEnteredIn('token')
      }
    }
  }

  const onLocalAmountInputChange = (value: string) => {
    // remove leading currency symbol and grouping separators
    if (value.startsWith(localCurrencySymbol)) {
      value = value.slice(1)
    }
    value = value.replaceAll(groupingSeparator, '')
    if (!value) {
      setLocalAmountInput('')
      setEnteredIn('local')
    } else {
      if (value.startsWith(decimalSeparator)) {
        value = `0${value}`
      }
      if (value.match(localAmountRegex)) {
        // add back currency symbol and grouping separators
        const [integerPart, decimalPart] = value.split(decimalSeparator)
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupingSeparator)
        setLocalAmountInput(
          `${localCurrencySymbol}${formattedInteger}${decimalPart !== undefined ? `${decimalSeparator}${decimalPart}` : ''}`
        )
        setEnteredIn('local')
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
          <TokenEnterAmount
            inputRef={tokenAmountInputRef}
            tokenValue={tokenAmountInput}
            localAmountValue={localAmountInput}
            onInputChange={handleAmountInputChange}
            localCurrencySymbol={localCurrencySymbol}
            amountType={enteredIn}
            toggleAmountType={handleToggleAmountType}
            autoFocus
            testID="SendEnterAmount"
            onTokenPickerSelect={onTokenPickerSelect}
            tokenSelectionDisabled={tokenSelectionDisabled}
            token={token}
          />
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>
              {t('sendEnterAmountScreen.networkFee', {
                networkName: NETWORK_NAMES[token.networkId],
              })}
            </Text>
            <View style={styles.feeAmountContainer}>{feeAmountSection}</View>
          </View>
        </View>

        {showMaxAmountWarning && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('sendEnterAmountScreen.maxAmountWarning.title')}
            description={t('sendEnterAmountScreen.maxAmountWarning.description', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrency.symbol,
            })}
            style={styles.warning}
            testID="SendEnterAmount/MaxAmountWarning"
          />
        )}
        {showNotEnoughBalanceForGasWarning && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('sendEnterAmountScreen.notEnoughBalanceForGasWarning.title', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
            })}
            description={t('sendEnterAmountScreen.notEnoughBalanceForGasWarning.description', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
            })}
            style={styles.warning}
            testID="SendEnterAmount/NotEnoughForGasWarning"
          />
        )}
        {prepareTransactionError && (
          <InLineNotification
            variant={NotificationVariant.Error}
            title={t('sendEnterAmountScreen.prepareTransactionError.title')}
            description={t('sendEnterAmountScreen.prepareTransactionError.description')}
            style={styles.warning}
            testID="SendEnterAmount/PrepareTransactionError"
          />
        )}

        {children}

        <ProceedComponent
          tokenAmount={tokenAmount}
          localAmount={localAmount}
          token={token}
          amountEnteredIn={enteredIn}
          onPressProceed={onPressProceed}
          disabled={disabled}
        />
        <KeyboardSpacer />
      </KeyboardAwareScrollView>
      <TokenBottomSheet
        forwardedRef={tokenBottomSheetRef}
        snapPoints={['90%']}
        origin={TokenPickerOrigin.Send}
        onTokenSelected={onSelectToken}
        tokens={tokens}
        title={t('sendEnterAmountScreen.selectToken')}
        titleStyle={styles.title}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Thick24,
    paddingTop: Spacing.Thick24,
    flexGrow: 1,
  },
  title: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Thick24,
  },
  inputContainer: {
    flex: 1,
  },
  feeContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.Regular16,
  },
  feeLabel: {
    flex: 1,
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
    paddingLeft: 2,
  },
  feeAmountContainer: {
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  feeInCryptoContainer: {
    flexDirection: 'row',
  },
  feeInCrypto: {
    color: Colors.gray4,
    ...typeScale.labelXSmall,
  },
  feeInFiat: {
    color: Colors.gray4,
    ...typeScale.bodyXSmall,
  },
  feesLoadingInternal: {
    ...typeScale.labelXSmall,
    width: 46,
    borderRadius: 100,
  },
  reviewButton: {
    paddingVertical: Spacing.Thick24,
  },
  warning: {
    marginBottom: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
})

export default EnterAmount
