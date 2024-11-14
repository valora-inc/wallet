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
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenEnterAmount from 'src/components/TokenEnterAmount'
import CustomHeader from 'src/components/header/CustomHeader'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import { AmountEnteredIn } from 'src/send/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { convertLocalToTokenAmount, convertTokenToLocalAmount, groupNumber } from 'src/tokens/utils'
import { parseInputAmount } from 'src/utils/parsing'
import { PreparedTransactionsResult, getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'

function roundTokenAmount(value: BigNumber) {
  const { decimalSeparator } = getNumberFormatSettings()
  if (value.valueOf() === '') {
    return new BigNumber(0).toFormat(2)
  }

  return value.decimalPlaces(6).toString().replaceAll('.', decimalSeparator)
}

function roundLocalAmount(bigNum: BigNumber, localCurrencySymbol: LocalCurrencySymbol) {
  const { decimalSeparator } = getNumberFormatSettings()
  if (bigNum.valueOf() === '') {
    return `${localCurrencySymbol}${new BigNumber(0).toFormat(2).replaceAll('.', decimalSeparator)}`
  }

  if (bigNum.isLessThan(0.000001)) {
    return `<${localCurrencySymbol}0${decimalSeparator}000001`
  }

  const rounded = bigNum.isLessThan(0.01) ? bigNum.toPrecision(1) : bigNum.toFixed(2)
  const formatted = rounded.toString().replaceAll('.', decimalSeparator)
  const grouped = groupNumber(formatted)

  return `${localCurrencySymbol}${bigNum.isLessThan(0.1) ? formatted : grouped}`
}

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
  showLoading?: boolean
}

interface Props {
  tokens: TokenBalance[]
  defaultToken?: TokenBalance
  prepareTransactionsResult?: PreparedTransactionsResult
  prepareTransactionsLoading: boolean
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
  showLoading,
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
      showLoading={showLoading}
      testID="SendEnterAmount/ReviewButton"
    />
  )
}

function EnterAmount({
  tokens,
  defaultToken,
  prepareTransactionsLoading,
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
  const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()
  const tokenAmountInputRef = useRef<RNTextInput>(null)
  const tokenBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const [amount, setAmount] = useState('')
  const [amountType, setAmountType] = useState<AmountEnteredIn>('token')

  const [token, setToken] = useState<TokenBalance>(() => defaultToken ?? tokens[0])

  // this should never be null, just adding a default to make TS happy
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const tokenInfo = useTokenInfo(token.tokenId)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)

  const derived = useMemo(() => {
    if (amountType === 'token') {
      const parsedTokenAmount = parseInputAmount(amount, decimalSeparator)
      const tokenToLocal = convertTokenToLocalAmount({
        tokenAmount: parsedTokenAmount,
        tokenInfo,
        usdToLocalRate,
      })
      const convertedTokenToLocal =
        tokenToLocal && tokenToLocal.gt(0)
          ? tokenToLocal.toString().replaceAll('.', decimalSeparator)
          : ''
      const parsedLocalAmount = parseInputAmount(
        convertedTokenToLocal.replaceAll(groupingSeparator, ''),
        decimalSeparator
      )

      return {
        token: {
          amount: amount,
          bignum: parsedTokenAmount,
          readable: roundTokenAmount(parsedTokenAmount),
        },
        local: {
          amount: convertedTokenToLocal,
          bignum: parsedLocalAmount,
          readable: roundLocalAmount(parsedLocalAmount, localCurrencySymbol),
        },
        valueToRefreshWith: parsedTokenAmount,
      }
    }

    const parsedLocalAmount = parseInputAmount(
      amount.replaceAll(groupingSeparator, ''),
      decimalSeparator
    )

    const localToToken = convertLocalToTokenAmount({
      localAmount: parsedLocalAmount,
      tokenInfo,
      usdToLocalRate,
    })
    const convertedLocalToToken =
      localToToken && localToToken.gt(0)
        ? // no group separator for token amount, round to token.decimals and strip trailing zeros
          localToToken
            .toFormat(token.decimals, { decimalSeparator })
            .replace(new RegExp(`[${decimalSeparator}]?0+$`), '')
        : ''

    const parsedTokenAmount = parseInputAmount(convertedLocalToToken, decimalSeparator)

    return {
      token: {
        amount: convertedLocalToToken,
        bignum: parsedTokenAmount,
        readable: roundTokenAmount(parsedTokenAmount),
      },
      local: {
        amount: amount,
        bignum: parsedLocalAmount,
        readable: roundLocalAmount(parsedLocalAmount, localCurrencySymbol),
      },
      valueToRefreshWith: localToToken,
    }
  }, [amount, amountType, localCurrencySymbol])

  const onTokenPickerSelect = () => {
    tokenBottomSheetRef.current?.snapToIndex(0)
    AppAnalytics.track(SendEvents.token_dropdown_opened, {
      currentTokenId: token.tokenId,
      currentTokenAddress: token.address,
      currentNetworkId: token.networkId,
    })
  }

  const handleToggleAmountType = () => {
    setAmountType((prev) => (prev === 'local' ? 'token' : 'local'))

    tokenAmountInputRef.current?.blur()
  }

  const onSelectToken = (token: TokenBalance) => {
    setToken(token)
    tokenBottomSheetRef.current?.close()

    handleAmountInputChange('')
    // NOTE: analytics is already fired by the bottom sheet, don't need one here
  }

  // @ts-ignore - the max button will be restored in the next PR
  const onMaxAmountPress = async () => {
    // eventually we may want to do something smarter here, like subtracting gas fees from the max amount if
    // this is a gas-paying token. for now, we are just showing a warning to the user prompting them to lower the amount
    // if there is not enough for gas
    setAmount(token.balance.toFormat({ decimalSeparator }))
    setAmountType('token')

    tokenAmountInputRef.current?.blur()
    AppAnalytics.track(SendEvents.max_pressed, {
      tokenId: token.tokenId,
      tokenAddress: token.address,
      networkId: token.networkId,
    })
  }

  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, token.networkId))
  const { tokenId: feeTokenId } = feeCurrency ?? feeCurrencies[0]

  useEffect(() => {
    onClearPreparedTransactions()

    if (
      !derived.valueToRefreshWith ||
      derived.valueToRefreshWith.isLessThanOrEqualTo(0) ||
      derived.valueToRefreshWith.isGreaterThan(token.balance)
    ) {
      return
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return onRefreshPreparedTransactions(derived.valueToRefreshWith!, token, feeCurrencies)
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [derived.valueToRefreshWith, token])

  const isAmountLessThanBalance =
    derived.valueToRefreshWith && derived.valueToRefreshWith.lte(token.balance)
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
    disableProceed ||
    (disableBalanceCheck ? !!derived.valueToRefreshWith?.isZero() : !transactionIsPossible)

  const handleAmountInputChange = (val: string) => {
    let value = val.replaceAll(groupingSeparator, '')

    if (!value) {
      setAmount('')
      return
    }

    if (value.startsWith(decimalSeparator)) {
      value = `0${value}`
    }

    // only allow numbers, one decimal separator and amount of decimals equal to token.decimals
    const tokenAmountRegex = new RegExp(
      `^(?:\\d+[${decimalSeparator}]?\\d{0,${token.decimals}}|[${decimalSeparator}]\\d{0,${token.decimals}}|[${decimalSeparator}])$`
    )

    // only allow numbers, one decimal separator and 2 decimals
    const localAmountRegex = new RegExp(
      `^(\\d+([${decimalSeparator}])?\\d{0,2}|[${decimalSeparator}]\\d{0,2}|[${decimalSeparator}])$`
    )

    if (
      (amountType === 'token' && value.match(tokenAmountRegex)) ||
      (amountType === 'local' && value.match(localAmountRegex))
    ) {
      setAmount(value)
      return
    }
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
          <TokenEnterAmount
            autoFocus
            testID="SendEnterAmount"
            token={token}
            inputRef={tokenAmountInputRef}
            tokenAmount={derived.token.amount}
            localAmount={derived.local.amount}
            onInputChange={handleAmountInputChange}
            amountType={amountType}
            toggleAmountType={handleToggleAmountType}
            onTokenPickerSelect={tokenSelectionDisabled ? undefined : onTokenPickerSelect}
          />

          {!!maxFeeAmount && (
            <View style={styles.feeContainer} testID="SendEnterAmount/Fee">
              <LabelWithInfo
                label={t('sendEnterAmountScreen.networkFeeV1_97')}
                labelStyle={{ color: Colors.gray3 }}
                testID="SendEnterAmount/FeeLabel"
              />
              <View testID="SendEnterAmount/FeeInCrypto" style={styles.feeInCryptoContainer}>
                <TokenDisplay
                  showApprox
                  showLocalAmount={false}
                  style={styles.feeValue}
                  tokenId={feeTokenId}
                  amount={maxFeeAmount}
                />
                <Text style={styles.feeValue}>
                  {'('}
                  <TokenDisplay
                    tokenId={feeTokenId}
                    amount={maxFeeAmount}
                    style={styles.feeValue}
                  />
                  {')'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {showLowerAmountError && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('sendEnterAmountScreen.insufficientBalanceWarning.title', {
              tokenSymbol: token.symbol,
            })}
            description={t('sendEnterAmountScreen.insufficientBalanceWarning.description', {
              tokenSymbol: token.symbol,
            })}
            style={styles.warning}
            testID="SendEnterAmount/NotEnoughBalanceWarning"
          />
        )}
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
          tokenAmount={derived.token.bignum}
          localAmount={derived.local.bignum}
          token={token}
          amountEnteredIn={amountType}
          onPressProceed={onPressProceed}
          disabled={disabled}
          showLoading={prepareTransactionsLoading}
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
    marginVertical: Spacing.Regular16,
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 12,
    gap: Spacing.Smallest8,
    flexDirection: 'row',
  },
  feeInCryptoContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  feeValue: {
    ...typeScale.bodyMedium,
    color: Colors.gray3,
    flexWrap: 'wrap',
    textAlign: 'right',
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
