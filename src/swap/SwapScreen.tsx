import { parseInputAmount } from '@celo/utils/lib/parsing'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { TRANSACTION_FEES_LEARN_MORE } from 'src/brandingConfig'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TokenBottomSheet, {
  TokenBalanceItemOption,
  TokenPickerOrigin,
} from 'src/components/TokenBottomSheet'
import CustomHeader from 'src/components/header/CustomHeader'
import { SWAP_LEARN_MORE } from 'src/config'
import { useMaxSendAmountByAddress } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams, getExperimentParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs, ExperimentConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import PreparedTransactionsReviewBottomSheet from 'src/swap/PreparedTransactionsReviewBottomSheet'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import { priceImpactWarningThresholdSelector, swapInfoSelector } from 'src/swap/selectors'
import { setSwapUserInput } from 'src/swap/slice'
import { Field, SwapAmount } from 'src/swap/types'
import useSwapQuote from 'src/swap/useSwapQuote'
import { useTokenInfoByAddress } from 'src/tokens/hooks'
import { swappableTokensSelector } from 'src/tokens/selectors'
import { TokenBalanceWithAddress } from 'src/tokens/slice'
import { getTokenId } from 'src/tokens/utils'
import networkConfig from 'src/web3/networkConfig'

const FETCH_UPDATED_QUOTE_DEBOUNCE_TIME = 500
const DEFAULT_SWAP_AMOUNT: SwapAmount = {
  [Field.FROM]: '',
  [Field.TO]: '',
}

type Props = NativeStackScreenProps<StackParamList, Screens.SwapScreenWithBack>

export function SwapScreen({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const tokenBottomSheetRef = useRef<BottomSheetRefType>(null)
  const preparedTransactionsReviewBottomSheetRef = useRef<BottomSheetRefType>(null)
  const networkFeeInfoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const showTransactionDetails = false // TODO remove this dummy feature flag after the transaction details are implemented

  const { decimalSeparator } = getNumberFormatSettings()

  const { swappingNonNativeTokensEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.SWAPPING_NON_NATIVE_TOKENS]
  )
  const { swapBuyAmountEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.SWAP_BUY_AMOUNT]
  )
  const slippagePercentage = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  ).maxSlippagePercentage

  const useViemForSwap = getFeatureGate(StatsigFeatureGates.USE_VIEM_FOR_SWAP)

  // sorted by USD balance and then alphabetical
  const supportedTokens = useSelector(swappableTokensSelector)
  const swappableTokens = useMemo(() => {
    if (!swappingNonNativeTokensEnabled) {
      return supportedTokens.filter((token) => token.isCoreToken)
    }
    return supportedTokens
  }, [supportedTokens])

  const swapInfo = useSelector(swapInfoSelector)
  const priceImpactWarningThreshold = useSelector(priceImpactWarningThresholdSelector)

  const initialFromTokenId = route.params?.fromTokenId
  const initialFromToken = initialFromTokenId
    ? swappableTokens.find((token) => token.tokenId === initialFromTokenId)
    : undefined
  const [fromToken, setFromToken] = useState<TokenBalanceWithAddress | undefined>(initialFromToken)
  const [toToken, setToToken] = useState<TokenBalanceWithAddress | undefined>()

  // Raw input values (can contain region specific decimal separators)
  const [swapAmount, setSwapAmount] = useState(DEFAULT_SWAP_AMOUNT)
  const [updatedField, setUpdatedField] = useState(Field.FROM)
  const [selectingToken, setSelectingToken] = useState<Field | null>(null)
  const [fromSwapAmountError, setFromSwapAmountError] = useState(false)
  const [showMaxSwapAmountWarning, setShowMaxSwapAmountWarning] = useState(false)

  const maxFromAmountUnchecked = useMaxSendAmountByAddress(fromToken?.address || '', FeeType.SWAP)
  const maxFromAmount = maxFromAmountUnchecked.isLessThan(0)
    ? new BigNumber(0)
    : maxFromAmountUnchecked
  // TODO: Check the user has enough balance in native tokens to pay for the gas fee

  const fromTokenBalance = useTokenInfoByAddress(fromToken?.address)?.balance ?? new BigNumber(0)

  const { exchangeRate, refreshQuote, fetchSwapQuoteError, fetchingSwapQuote, clearQuote } =
    useSwapQuote(slippagePercentage)

  // Parsed swap amounts (BigNumber)
  const parsedSwapAmount = useMemo(
    () => ({
      [Field.FROM]: parseInputAmount(swapAmount[Field.FROM], decimalSeparator),
      [Field.TO]: parseInputAmount(swapAmount[Field.TO], decimalSeparator),
    }),
    [swapAmount]
  )

  // Used to reset the swap when after a successful swap or error
  useEffect(() => {
    if (swapInfo === null) {
      setSwapAmount(DEFAULT_SWAP_AMOUNT)
      setUpdatedField(Field.FROM)
      setSelectingToken(null)
      setFromToken(initialFromToken)
      setToToken(undefined)
    }
  }, [swapInfo])

  useEffect(() => {
    ValoraAnalytics.track(SwapEvents.swap_screen_open)
  }, [])

  useEffect(() => {
    if (fetchSwapQuoteError) {
      dispatch(showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED))
    }
  }, [fetchSwapQuoteError])

  useEffect(() => {
    setFromSwapAmountError(false)
    // since we use the calculated exchange rate to update the parsedSwapAmount,
    // this hook will be triggered after the exchange rate is first updated. this
    // variable prevents the exchange rate from needlessly being calculated
    // again.
    const exchangeRateKnown =
      fromToken &&
      toToken &&
      exchangeRate &&
      exchangeRate.toTokenAddress === toToken.address &&
      exchangeRate.fromTokenAddress === fromToken.address &&
      exchangeRate.swapAmount.eq(parsedSwapAmount[updatedField])

    const debouncedRefreshQuote = setTimeout(() => {
      if (fromToken && toToken && parsedSwapAmount[updatedField].gt(0) && !exchangeRateKnown) {
        void refreshQuote(fromToken, toToken, parsedSwapAmount, updatedField, useViemForSwap)
      }
    }, FETCH_UPDATED_QUOTE_DEBOUNCE_TIME)

    return () => {
      clearTimeout(debouncedRefreshQuote)
    }
  }, [fromToken, toToken, parsedSwapAmount, updatedField, exchangeRate])

  useEffect(() => {
    if (showMaxSwapAmountWarning && fromToken?.symbol !== 'CELO') {
      setShowMaxSwapAmountWarning(false)
    }
  }, [fromToken, showMaxSwapAmountWarning])

  useEffect(
    () => {
      if (!exchangeRate) {
        setSwapAmount((prev) => {
          const otherField = updatedField === Field.FROM ? Field.TO : Field.FROM
          return {
            ...prev,
            [otherField]: '',
          }
        })
        return
      }

      const newAmount = parsedSwapAmount[updatedField].multipliedBy(
        new BigNumber(exchangeRate.price).pow(updatedField === Field.FROM ? 1 : -1)
      )

      const swapFromAmount = updatedField === Field.FROM ? parsedSwapAmount[Field.FROM] : newAmount
      const swapToAmount = updatedField === Field.FROM ? newAmount : parsedSwapAmount[Field.TO]
      setSwapAmount({
        [Field.FROM]: swapFromAmount.toFormat({
          decimalSeparator,
        }),
        [Field.TO]: swapToAmount.toFormat({
          decimalSeparator,
        }),
      })

      if (
        !exchangeRate.estimatedPriceImpact ||
        exchangeRate.estimatedPriceImpact.gte(priceImpactWarningThreshold)
      ) {
        ValoraAnalytics.track(SwapEvents.swap_price_impact_warning_displayed, {
          toToken: exchangeRate.toTokenAddress,
          fromToken: exchangeRate.fromTokenAddress,
          amount: parsedSwapAmount[updatedField].toString(),
          amountType: updatedField === Field.FROM ? 'sellAmount' : 'buyAmount',
          priceImpact: exchangeRate.estimatedPriceImpact?.toString(),
          provider: exchangeRate.provider,
        })
      }
    },
    // We only want to update the other field when the exchange rate changes
    // that's why we don't include the other dependencies

    [exchangeRate]
  )

  const handleReview = () => {
    ValoraAnalytics.track(SwapEvents.swap_screen_review_swap)

    const userInput = {
      toToken: toToken!.address,
      fromToken: fromToken!.address,
      swapAmount: {
        [Field.FROM]: parsedSwapAmount[Field.FROM].toString(),
        [Field.TO]: parsedSwapAmount[Field.TO].toString(),
      },
      updatedField,
    }

    if (useViemForSwap) {
      if (!exchangeRate?.preparedTransactions) {
        // Error already shown, do nothing
        return
      }

      if (parsedSwapAmount[Field.FROM].gt(fromTokenBalance)) {
        setFromSwapAmountError(true)
        showMaxCeloSwapWarning()
        dispatch(showError(t('swapScreen.insufficientFunds', { token: fromToken?.symbol })))
        return
      }

      const resultType = exchangeRate.preparedTransactions.type
      switch (resultType) {
        case 'need-decrease-spend-amount-for-gas': // fallthrough on purpose
        case 'not-enough-balance-for-gas':
          preparedTransactionsReviewBottomSheetRef.current?.snapToIndex(0)
          break
        case 'possible':
          // TODO: we want to remove the need to use redux, but for now keeping it
          // to avoid too many changes
          dispatch(setSwapUserInput(userInput))
          navigate(Screens.SwapReviewScreen, {
            quote: exchangeRate,
          })
          break
        default:
          // To catch any missing cases at compile time
          const assertNever: never = resultType
          return assertNever
      }

      return
    }

    if (parsedSwapAmount[Field.FROM].gt(maxFromAmount)) {
      setFromSwapAmountError(true)
      showMaxCeloSwapWarning()
      dispatch(showError(t('swapScreen.insufficientFunds', { token: fromToken?.symbol })))
    } else {
      dispatch(setSwapUserInput(userInput))
      navigate(Screens.SwapReviewScreen)
    }
  }

  const handleShowTokenSelect = (fieldType: Field) => () => {
    ValoraAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType })
    setSelectingToken(fieldType)

    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingToken value is updated, so that the title of the
    // bottom sheet (which depends on selectingToken) does not change on the
    // screen
    requestAnimationFrame(() => {
      tokenBottomSheetRef.current?.snapToIndex(0)
    })
  }

  const handleSelectToken = ({ address: tokenAddress }: TokenBalanceWithAddress) => {
    const selectedToken = swappableTokens.find((token) => token.address === tokenAddress)
    if (selectedToken && selectingToken) {
      ValoraAnalytics.track(SwapEvents.swap_screen_confirm_token, {
        fieldType: selectingToken,
        tokenSymbol: selectedToken.symbol,
      })
    }

    if (
      (selectingToken === Field.FROM && toToken?.address === tokenAddress) ||
      (selectingToken === Field.TO && fromToken?.address === tokenAddress)
    ) {
      setFromToken(toToken)
      setToToken(fromToken)
    } else if (selectingToken === Field.FROM) {
      setFromToken(selectedToken)
    } else if (selectingToken === Field.TO) {
      setToToken(selectedToken)
    }

    setSelectingToken(null)

    // use requestAnimationFrame so that the bottom sheet and keyboard dismiss
    // animation can be synchronised and starts after the state changes above.
    // without this, the keyboard animation lags behind the state updates while
    // the bottom sheet does not
    requestAnimationFrame(() => {
      tokenBottomSheetRef.current?.close()
    })
  }

  const handleChangeAmount = (fieldType: Field) => (value: string) => {
    if (!value) {
      setSwapAmount(DEFAULT_SWAP_AMOUNT)
      clearQuote()
    } else {
      setUpdatedField(fieldType)
      setSwapAmount((prev) => ({
        ...prev,
        // Regex to match only numbers and one decimal separator
        [fieldType]: value.match(/^(?:\d+[.,]?\d*|[.,]\d*|[.,])$/)?.join('') ?? prev[fieldType],
      }))
    }

    setShowMaxSwapAmountWarning(false)
  }

  const handleSetMaxFromAmount = () => {
    setUpdatedField(Field.FROM)
    setSwapAmount((prev) => ({
      ...prev,
      [Field.FROM]: (useViemForSwap
        ? // The viem flow uses the new fee currency selection logic
          // which returns fully determined TXs (gas, feeCurrency, etc).
          // We try the current balance first, and we will prompt the user if it's too high
          fromTokenBalance
        : maxFromAmount
      ).toFormat({
        decimalSeparator,
      }),
    }))
    showMaxCeloSwapWarning()
    ValoraAnalytics.track(SwapEvents.swap_screen_max_swap_amount, {
      tokenSymbol: fromToken?.symbol,
    })
  }

  const showMaxCeloSwapWarning = () => {
    if (fromToken?.symbol === 'CELO') {
      setShowMaxSwapAmountWarning(true)
    }
  }

  const allowReview = useMemo(
    () => Object.values(parsedSwapAmount).every((amount) => amount.gt(0)),
    [parsedSwapAmount]
  )

  const onPressLearnMore = () => {
    ValoraAnalytics.track(SwapEvents.swap_learn_more)
    navigate(Screens.WebViewScreen, { uri: SWAP_LEARN_MORE })
  }

  const onPressLearnMoreFees = () => {
    ValoraAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    navigate(Screens.WebViewScreen, { uri: TRANSACTION_FEES_LEARN_MORE })
  }

  const exchangeRateUpdatePending =
    exchangeRate &&
    (exchangeRate.fromTokenAddress !== fromToken?.address ||
      exchangeRate.toTokenAddress !== toToken?.address ||
      !exchangeRate.swapAmount.eq(parsedSwapAmount[updatedField]))

  const showMissingPriceImpactWarning =
    (!fetchingSwapQuote && exchangeRate && !exchangeRate.estimatedPriceImpact) ||
    (fromToken && toToken && (!fromToken.priceUsd || !toToken.priceUsd))
  const showPriceImpactWarning =
    !fetchingSwapQuote &&
    !!exchangeRate?.estimatedPriceImpact?.gte(priceImpactWarningThreshold) &&
    !showMissingPriceImpactWarning

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader
        style={{ paddingHorizontal: variables.contentPadding }}
        left={<BackButton />}
        title={t('swapScreen.title')}
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.swapAmountsContainer}>
          <SwapAmountInput
            label={t('swapScreen.swapFrom')}
            onInputChange={handleChangeAmount(Field.FROM)}
            inputValue={swapAmount[Field.FROM]}
            onSelectToken={handleShowTokenSelect(Field.FROM)}
            token={fromToken}
            style={styles.fromSwapAmountInput}
            loading={updatedField === Field.TO && fetchingSwapQuote}
            autoFocus
            inputError={fromSwapAmountError}
            onPressMax={handleSetMaxFromAmount}
            buttonPlaceholder={t('swapScreen.swapFromTokenSelection')}
          />
          <SwapAmountInput
            label={t('swapScreen.swapTo')}
            onInputChange={handleChangeAmount(Field.TO)}
            inputValue={swapAmount[Field.TO]}
            onSelectToken={handleShowTokenSelect(Field.TO)}
            token={toToken}
            style={styles.toSwapAmountInput}
            loading={updatedField === Field.FROM && fetchingSwapQuote}
            buttonPlaceholder={t('swapScreen.swapToTokenSelection')}
            editable={swapBuyAmountEnabled}
          >
            <Text style={[styles.exchangeRateText, { opacity: exchangeRateUpdatePending ? 0 : 1 }]}>
              {fromToken && toToken && exchangeRate ? (
                <>
                  {`1 ${fromToken.symbol} ≈ `}
                  <Text style={styles.exchangeRateValueText}>
                    {`${new BigNumber(exchangeRate.price).toFormat(5, BigNumber.ROUND_DOWN)} ${
                      toToken.symbol
                    }`}
                  </Text>
                </>
              ) : (
                <Trans i18nKey={'swapScreen.estimatedExchangeRate'}>
                  <Text style={styles.exchangeRateValueText} />
                </Trans>
              )}
            </Text>
          </SwapAmountInput>

          {showTransactionDetails && (
            <SwapTransactionDetails
              networkId={fromToken?.networkId}
              networkFee={new BigNumber(1)}
              networkFeeInfoBottomSheetRef={networkFeeInfoBottomSheetRef}
              feeTokenId={getTokenId(networkConfig.defaultNetworkId)}
              slippagePercentage={slippagePercentage}
            />
          )}

          {showMaxSwapAmountWarning && (
            <InLineNotification
              severity={Severity.Warning}
              title={t('swapScreen.maxSwapAmountWarning.title')}
              description={t('swapScreen.maxSwapAmountWarning.body')}
              ctaLabel={t('swapScreen.maxSwapAmountWarning.learnMore')}
              style={styles.warning}
              onPressCta={onPressLearnMoreFees}
            />
          )}
          {showPriceImpactWarning && (
            <InLineNotification
              severity={Severity.Warning}
              title={t('swapScreen.priceImpactWarning.title')}
              description={t('swapScreen.priceImpactWarning.body')}
              style={styles.warning}
            />
          )}
          {showMissingPriceImpactWarning && (
            <InLineNotification
              severity={Severity.Warning}
              title={t('swapScreen.missingSwapImpactWarning.title')}
              description={t('swapScreen.missingSwapImpactWarning.body')}
              style={styles.warning}
            />
          )}
        </View>
        <Text style={styles.disclaimerText}>
          <Trans i18nKey="swapScreen.disclaimer">
            <Text style={styles.disclaimerLink} onPress={onPressLearnMore}></Text>
          </Trans>
        </Text>
        <Button
          onPress={handleReview}
          text={t('swapScreen.review')}
          size={BtnSizes.FULL}
          disabled={!allowReview}
        />
        <KeyboardSpacer topSpacing={Spacing.Regular16} />
      </KeyboardAwareScrollView>
      <TokenBottomSheet
        forwardedRef={tokenBottomSheetRef}
        snapPoints={['90%']}
        origin={TokenPickerOrigin.Swap}
        onTokenSelected={handleSelectToken}
        searchEnabled={swappingNonNativeTokensEnabled}
        tokens={swappableTokens}
        title={
          selectingToken == Field.FROM
            ? t('swapScreen.swapFromTokenSelection')
            : t('swapScreen.swapToTokenSelection')
        }
        TokenOptionComponent={TokenBalanceItemOption}
      />
      {exchangeRate?.preparedTransactions && (
        <PreparedTransactionsReviewBottomSheet
          forwardedRef={preparedTransactionsReviewBottomSheetRef}
          preparedTransactions={exchangeRate.preparedTransactions}
          onAcceptDecreaseSwapAmountForGas={({ decreasedSpendAmount }) => {
            handleChangeAmount(updatedField)(
              // ensure units are for the asset whose amount is being selected by the user
              (updatedField === Field.FROM
                ? decreasedSpendAmount
                : decreasedSpendAmount.times(exchangeRate.price)
              ).toString()
            )
            preparedTransactionsReviewBottomSheetRef.current?.close()
          }}
        />
      )}
      <BottomSheet
        forwardedRef={networkFeeInfoBottomSheetRef}
        description={t('swapScreen.transactionDetails.networkFeeInfo', {
          networkName: NETWORK_NAMES[fromToken?.networkId || networkConfig.defaultNetworkId],
        })}
        testId="NetworkFeeInfoBottomSheet"
      >
        <Button
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.bottomSheetButton}
          onPress={() => {
            networkFeeInfoBottomSheetRef.current?.close()
          }}
          text={t('swapScreen.transactionDetails.networkFeeInfoDismissButton')}
        />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.Regular16,
    flexGrow: 1,
  },
  swapAmountsContainer: {
    paddingBottom: Spacing.Thick24,
    flex: 1,
  },
  fromSwapAmountInput: {
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  toSwapAmountInput: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: Spacing.Small12,
  },
  disclaimerText: {
    ...fontStyles.xsmall,
    paddingBottom: Spacing.Smallest8,
    flexWrap: 'wrap',
    color: colors.gray5,
    textAlign: 'center',
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
    color: colors.greenUI,
  },
  exchangeRateText: {
    ...fontStyles.xsmall,
    color: colors.gray3,
  },
  exchangeRateValueText: {
    ...fontStyles.xsmall600,
  },
  warning: {
    marginTop: Spacing.Thick24,
  },
  bottomSheetButton: {
    marginTop: Spacing.Thick24,
  },
})

export default SwapScreen
