import { parseInputAmount } from '@celo/utils/lib/parsing'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EarnEvents, SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import EarnAddCryptoBottomSheet from 'src/earn/EarnAddCryptoBottomSheet'
import { EarnApyAndAmount } from 'src/earn/EarnApyAndAmount'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { PROVIDER_ID } from 'src/earn/constants'
import { usePrepareSupplyTransactions } from 'src/earn/prepareTransactions'
import { CICOFlow } from 'src/fiatExchanges/utils'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import { AmountInput, ProceedArgs } from 'src/send/EnterAmount'
import { AmountEnteredIn } from 'src/send/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useLocalToTokenAmount, useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { isAddress } from 'viem'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnEnterAmount>

const TAG = 'EarnEnterAmount'

const TOKEN_SELECTOR_BORDER_RADIUS = 100
const MAX_BORDER_RADIUS = 96
const FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME = 250

type ProceedComponentProps = Omit<ProceedArgs, 'tokenAmount'> & {
  onPressProceed(args: ProceedArgs): void
  onPressInfo(): void
  disabled: boolean
  tokenAmount: BigNumber | null
  loading: boolean
}

function EarnEnterAmount({ route }: Props) {
  const { t } = useTranslation()

  const { tokenId } = route.params
  const token = useTokenInfo(tokenId)

  if (!token) {
    throw new Error(`Token info not found for token ID ${tokenId}`)
  }

  const infoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const addCryptoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const reviewBottomSheetRef = useRef<BottomSheetRefType>(null)
  const tokenAmountInputRef = useRef<RNTextInput>(null)
  const localAmountInputRef = useRef<RNTextInput>(null)

  const [tokenAmountInput, setTokenAmountInput] = useState<string>('')
  const [localAmountInput, setLocalAmountInput] = useState<string>('')
  const [enteredIn, setEnteredIn] = useState<AmountEnteredIn>('token')
  // this should never be null, just adding a default to make TS happy
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD

  const {
    prepareTransactionsResult,
    refreshPreparedTransactions,
    clearPreparedTransactions,
    prepareTransactionError,
    isPreparingTransactions,
  } = usePrepareSupplyTransactions()

  const walletAddress = useSelector(walletAddressSelector)

  const handleRefreshPreparedTransactions = (
    amount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ) => {
    if (!walletAddress || !isAddress(walletAddress)) {
      Logger.error(TAG, 'Wallet address not set. Cannot refresh prepared transactions.')
      return
    }

    return refreshPreparedTransactions({
      amount: amount.toString(),
      token,
      walletAddress,
      feeCurrencies,
      poolContractAddress: networkConfig.arbAavePoolV3ContractAddress,
    })
  }

  const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()
  // only allow numbers, one decimal separator, and two decimal places
  const localAmountRegex = new RegExp(
    `^(\\d+([${decimalSeparator}])?\\d{0,2}|[${decimalSeparator}]\\d{0,2}|[${decimalSeparator}])$`
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

  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, token.networkId))

  useEffect(() => {
    clearPreparedTransactions()

    if (
      !tokenAmount ||
      tokenAmount.isLessThanOrEqualTo(0) ||
      tokenAmount.isGreaterThan(token.balance)
    ) {
      return
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return handleRefreshPreparedTransactions(tokenAmount, token, feeCurrencies)
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [tokenAmount, token])

  const isAmountLessThanBalance = tokenAmount && tokenAmount.lte(token.balance)
  const showNotEnoughBalanceForGasWarning =
    isAmountLessThanBalance &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
  const transactionIsPossible =
    isAmountLessThanBalance &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'possible' &&
    prepareTransactionsResult.transactions.length > 0

  const disabled =
    // Should disable if the user enters 0 or has enough balance but the transaction is not possible,
    // shouldn't disable if they enter an amount larger than their balance as they will go to add flow
    !!tokenAmount?.isZero() || (!!tokenAmount?.lte(token.balance) && !transactionIsPossible)

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
        setLocalAmountInput(
          `${localCurrencySymbol}${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, groupingSeparator)
        )
        setEnteredIn('local')
      }
    }
  }

  const onMaxAmountPress = async () => {
    // eventually we may want to do something smarter here, like subtracting gas fees from the max amount if
    // this is a gas-paying token. for now, we are just showing a warning to the user prompting them to lower the amount
    // if there is not enough for gas
    setTokenAmountInput(token.balance.toFormat({ decimalSeparator }))
    setEnteredIn('token')
    tokenAmountInputRef.current?.blur()
    localAmountInputRef.current?.blur()
    ValoraAnalytics.track(SendEvents.max_pressed, {
      tokenId: token.tokenId,
      tokenAddress: token.address,
      networkId: token.networkId,
    })
  }

  const onPressContinue = ({ tokenAmount, token, amountEnteredIn }: ProceedArgs) => {
    ValoraAnalytics.track(EarnEvents.earn_enter_amount_continue_press, {
      userHasFunds: !!isAmountLessThanBalance,
      tokenAmount: tokenAmount.toString(),
      amountInUsd: tokenAmount.multipliedBy(token.priceUsd ?? 0).toFixed(2),
      amountEnteredIn,
      depositTokenId: token.tokenId,
      networkId: token.networkId,
      providerId: PROVIDER_ID,
    })
    isAmountLessThanBalance
      ? reviewBottomSheetRef.current?.snapToIndex(0)
      : addCryptoBottomSheetRef.current?.snapToIndex(0)
  }

  const onPressInfo = () => {
    ValoraAnalytics.track(EarnEvents.earn_enter_amount_info_press)
    infoBottomSheetRef.current?.snapToIndex(0)
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
          <View style={styles.inputBox}>
            <View style={styles.inputRow}>
              <AmountInput
                inputRef={tokenAmountInputRef}
                inputValue={tokenAmountInput}
                onInputChange={onTokenAmountInputChange}
                inputStyle={styles.inputText}
                autoFocus
                placeholder={new BigNumber(0).toFormat(2)}
                testID="EarnEnterAmount/TokenAmountInput"
              />
              <View style={styles.tokenView} testID="EarnEnterAmount/TokenSelect">
                <>
                  <TokenIcon token={token} size={IconSize.SMALL} />
                  <Text style={styles.tokenName}>{token.symbol}</Text>
                </>
              </View>
            </View>
            <View style={styles.localAmountRow}>
              <AmountInput
                inputValue={token.priceUsd ? localAmountInput : '-'}
                onInputChange={onLocalAmountInputChange}
                inputRef={localAmountInputRef}
                inputStyle={styles.localAmount}
                placeholder={`${localCurrencySymbol}${new BigNumber(0).toFormat(2)}`}
                testID="EarnEnterAmount/LocalAmountInput"
                editable={!!token.priceUsd}
              />
              {!token.balance.isZero() && (
                <Touchable
                  borderRadius={MAX_BORDER_RADIUS}
                  onPress={onMaxAmountPress}
                  style={styles.maxTouchable}
                  testID="EarnEnterAmount/Max"
                >
                  <Text style={styles.maxText}>{t('max')}</Text>
                </Touchable>
              )}
            </View>
          </View>
        </View>
        {showNotEnoughBalanceForGasWarning && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('earnFlow.enterAmount.notEnoughBalanceForGasWarning.title', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
            })}
            description={t('earnFlow.enterAmount.notEnoughBalanceForGasWarning.description', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
              network: NETWORK_NAMES[prepareTransactionsResult.feeCurrencies[0].networkId],
            })}
            ctaLabel={t('earnFlow.enterAmount.notEnoughBalanceForGasWarning.noGasCta', {
              feeTokenSymbol: feeCurrencies[0].symbol,
              network: NETWORK_NAMES[prepareTransactionsResult.feeCurrencies[0].networkId],
            })}
            onPressCta={() => {
              ValoraAnalytics.track(EarnEvents.earn_deposit_add_gas_press, {
                gasTokenId: feeCurrencies[0].tokenId,
              })
              navigate(Screens.FiatExchangeAmount, {
                tokenId: prepareTransactionsResult.feeCurrencies[0].tokenId,
                flow: CICOFlow.CashIn,
                tokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
              })
            }}
            style={styles.warning}
            testID="EarnEnterAmount/NotEnoughForGasWarning"
          />
        )}
        {prepareTransactionError && (
          <InLineNotification
            variant={NotificationVariant.Error}
            title={t('sendEnterAmountScreen.prepareTransactionError.title')}
            description={t('sendEnterAmountScreen.prepareTransactionError.description')}
            style={styles.warning}
            testID="EarnEnterAmount/PrepareTransactionError"
          />
        )}
        <EarnProceed
          tokenAmount={tokenAmount}
          localAmount={localAmount}
          token={token}
          amountEnteredIn={enteredIn}
          onPressProceed={onPressContinue}
          onPressInfo={onPressInfo}
          disabled={disabled}
          loading={isPreparingTransactions}
        />
        <KeyboardSpacer />
      </KeyboardAwareScrollView>
      <InfoBottomSheet infoBottomSheetRef={infoBottomSheetRef} />
      <EarnAddCryptoBottomSheet
        forwardedRef={addCryptoBottomSheetRef}
        token={token}
        tokenAmount={tokenAmount ? tokenAmount.minus(token.balance) : new BigNumber(0)}
      />
      {tokenAmount && prepareTransactionsResult?.type === 'possible' && (
        <EarnDepositBottomSheet
          forwardedRef={reviewBottomSheetRef}
          preparedTransaction={prepareTransactionsResult}
          amount={tokenAmount}
          token={token}
          networkId={token.networkId}
        />
      )}
    </SafeAreaView>
  )
}

function EarnProceed({
  tokenAmount,
  localAmount,
  token,
  amountEnteredIn,
  disabled,
  onPressProceed,
  onPressInfo,
  loading,
}: ProceedComponentProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.infoContainer}>
      <EarnApyAndAmount tokenAmount={tokenAmount} token={token} testIDPrefix={'EarnEnterAmount'} />
      <Button
        onPress={() =>
          tokenAmount && onPressProceed({ tokenAmount, localAmount, token, amountEnteredIn })
        }
        text={t('earnFlow.enterAmount.continue')}
        style={styles.continueButton}
        size={BtnSizes.FULL}
        disabled={disabled}
        showLoading={loading}
        testID="EarnEnterAmount/Continue"
      />
      <View style={styles.row}>
        <Text style={styles.infoText}>{t('earnFlow.enterAmount.info')}</Text>
        <TouchableOpacity
          onPress={onPressInfo}
          hitSlop={variables.iconHitslop}
          testID="EarnEnterAmount/InfoIcon"
        >
          <InfoIcon color={Colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function InfoBottomSheet({
  infoBottomSheetRef,
}: {
  infoBottomSheetRef: React.RefObject<BottomSheetRefType>
}) {
  const { t } = useTranslation()

  const { moreAavePoolsUrl } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG]
  )
  const onPressDismiss = () => {
    infoBottomSheetRef.current?.close()
  }
  const onPressMorePools = () => {
    ValoraAnalytics.track(EarnEvents.earn_enter_amount_info_more_pools)
    moreAavePoolsUrl && navigate(Screens.WebViewScreen, { uri: moreAavePoolsUrl })
  }

  return (
    <BottomSheet
      forwardedRef={infoBottomSheetRef}
      title={t('earnFlow.enterAmount.infoBottomSheet.title')}
      testId={'Earn/EnterAmount/InfoBottomSheet'}
      titleStyle={styles.infoBottomSheetTitle}
    >
      <Text style={styles.infoBottomSheetText}>
        <Trans i18nKey="earnFlow.enterAmount.infoBottomSheet.description">
          <Text
            testID={'Earn/EnterAmount/InfoBottomSheet/Link'}
            onPress={onPressMorePools}
            style={styles.linkText}
          />
        </Trans>
      </Text>
      <Button
        onPress={onPressDismiss}
        text={t('earnFlow.enterAmount.infoBottomSheet.dismiss')}
        size={BtnSizes.FULL}
        type={BtnTypes.SECONDARY}
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  infoContainer: {
    padding: Spacing.Regular16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray2,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.Tiny4,
  },
  continueButton: {
    paddingVertical: Spacing.Thick24,
  },
  infoText: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
  infoBottomSheetTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  infoBottomSheetText: {
    ...typeScale.bodySmall,
    marginBottom: Spacing.Thick24,
    color: Colors.black,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Thick24,
    paddingTop: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  inputContainer: {
    flex: 1,
  },
  inputBox: {
    marginTop: Spacing.Large32,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: Colors.gray2,
  },
  inputRow: {
    paddingHorizontal: Spacing.Regular16,
    paddingTop: Spacing.Smallest8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  localAmountRow: {
    marginTop: Spacing.Thick24,
    marginLeft: Spacing.Regular16,
    paddingRight: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
    paddingTop: Spacing.Thick24,
    borderTopColor: Colors.gray2,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    ...typeScale.titleMedium,
    color: Colors.black,
  },
  tokenView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: TOKEN_SELECTOR_BORDER_RADIUS,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
  },
  tokenName: {
    ...typeScale.labelSmall,
    paddingLeft: Spacing.Tiny4,
    paddingRight: Spacing.Smallest8,
    color: Colors.black,
  },
  localAmount: {
    ...typeScale.labelMedium,
  },
  maxTouchable: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.gray2,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: MAX_BORDER_RADIUS,
  },
  maxText: {
    ...typeScale.labelSmall,
    color: Colors.black,
  },
  warning: {
    marginTop: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
})

export default EarnEnterAmount
