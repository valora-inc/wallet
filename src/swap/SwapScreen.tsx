import { parseInputAmount } from '@celo/utils/lib/parsing'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { TRANSACTION_FEES_LEARN_MORE } from 'src/brandingConfig'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
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
import useSelector from 'src/redux/useSelector'
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
import { getSwapTxsAnalyticsProperties } from 'src/swap/getSwapTxsAnalyticsProperties'
import { currentSwapSelector, priceImpactWarningThresholdSelector } from 'src/swap/selectors'
import { swapStart, swapStartPrepared } from 'src/swap/slice'
import { Field, SwapAmount } from 'src/swap/types'
import useSwapQuote, { QuoteResult } from 'src/swap/useSwapQuote'
import { useSwappableTokens, useTokenInfo } from 'src/tokens/hooks'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap, getTokenId } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { divideByWei } from 'src/utils/formatting'
import { getFeeCurrencyAndAmount } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import networkConfig from 'src/web3/networkConfig'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'SwapScreen'

const FETCH_UPDATED_QUOTE_DEBOUNCE_TIME = 200
const DEFAULT_SWAP_AMOUNT: SwapAmount = {
  [Field.FROM]: '',
  [Field.TO]: '',
}

type Props = NativeStackScreenProps<StackParamList, Screens.SwapScreenWithBack>

function getNetworkFee(quote: QuoteResult | null, networkId?: NetworkId) {
  // TODO remove this block once we have viem enabled for everyone. this block
  // only services the contractKit (Celo) flow. the fee will be displayed in
  // fiat value and will be very low, since it's an approximation anyway we'll
  // simplify this logic to just use the fees from the quote.
  if (quote && !quote.preparedTransactions) {
    return {
      networkFee: divideByWei(
        new BigNumber(quote.rawSwapResponse.unvalidatedSwapTransaction.gas).multipliedBy(
          new BigNumber(quote.rawSwapResponse.unvalidatedSwapTransaction.gasPrice)
        )
      ),
      feeTokenId: getTokenId(networkId ?? networkConfig.defaultNetworkId), // native token
    }
  }

  const { feeAmount, feeCurrency } = getFeeCurrencyAndAmount(quote?.preparedTransactions)
  return {
    networkFee: feeAmount,
    feeTokenId: feeCurrency?.tokenId ?? getTokenId(networkId ?? networkConfig.defaultNetworkId), // native token
  }
}

export function SwapScreen({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const tokenBottomSheetRef = useRef<BottomSheetRefType>(null)
  const preparedTransactionsReviewBottomSheetRef = useRef<BottomSheetRefType>(null)
  const networkFeeInfoBottomSheetRef = useRef<BottomSheetRefType>(null)

  const { decimalSeparator } = getNumberFormatSettings()

  const { swapBuyAmountEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.SWAP_BUY_AMOUNT]
  )
  const slippagePercentage = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  ).maxSlippagePercentage
  const parsedSlippagePercentage = new BigNumber(slippagePercentage).toFormat()

  const useViemForSwap = getFeatureGate(StatsigFeatureGates.USE_VIEM_FOR_SWAP)

  // sorted by USD balance and then alphabetical
  const supportedTokens = useSwappableTokens()

  // Keep track of which swap is currently being executed from this screen
  // This is because there could be multiple swaps happening at the same time
  const [startedSwapId, setStartedSwapId] = useState<string | null>(null)
  const currentSwap = useSelector(currentSwapSelector)
  const swapStatus = startedSwapId === currentSwap?.id ? currentSwap.status : null
  const priceImpactWarningThreshold = useSelector(priceImpactWarningThresholdSelector)

  const tokensById = useSelector((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )

  const initialFromTokenId = route.params?.fromTokenId
  const initialFromToken = initialFromTokenId
    ? supportedTokens.find((token) => token.tokenId === initialFromTokenId)
    : undefined
  const [fromToken, setFromToken] = useState<TokenBalance | undefined>(initialFromToken)
  const [toToken, setToToken] = useState<TokenBalance | undefined>()

  // Raw input values (can contain region specific decimal separators)
  const [swapAmount, setSwapAmount] = useState(DEFAULT_SWAP_AMOUNT)
  const [updatedField, setUpdatedField] = useState(Field.FROM)
  const [selectingToken, setSelectingToken] = useState<Field | null>(null)
  const [fromSwapAmountError, setFromSwapAmountError] = useState(false)
  const [shouldShowMaxSwapAmountWarning, setShouldShowMaxSwapAmountWarning] = useState(false)

  // TODO: remove this once we have viem enabled for everyone
  const maxFromAmountUnchecked = useMaxSendAmountByAddress(fromToken?.address || '', FeeType.SWAP)
  const maxFromAmount = maxFromAmountUnchecked.isLessThan(0)
    ? new BigNumber(0)
    : maxFromAmountUnchecked
  // TODO: Check the user has enough balance in native tokens to pay for the gas fee

  const fromTokenBalance = useTokenInfo(fromToken?.tokenId)?.balance ?? new BigNumber(0)

  const { exchangeRate, refreshQuote, fetchSwapQuoteError, fetchingSwapQuote, clearQuote } =
    useSwapQuote(fromToken?.networkId || networkConfig.defaultNetworkId, slippagePercentage)

  // Parsed swap amounts (BigNumber)
  const parsedSwapAmount = useMemo(
    () => ({
      [Field.FROM]: parseInputAmount(swapAmount[Field.FROM], decimalSeparator),
      [Field.TO]: parseInputAmount(swapAmount[Field.TO], decimalSeparator),
    }),
    [swapAmount]
  )

  const exchangeRateUpdatePending =
    (exchangeRate &&
      (exchangeRate.fromTokenId !== fromToken?.tokenId ||
        exchangeRate.toTokenId !== toToken?.tokenId ||
        !exchangeRate.swapAmount.eq(parsedSwapAmount[updatedField]))) ||
    fetchingSwapQuote

  const confirmSwapIsLoading = swapStatus === 'started'
  const confirmSwapFailed = swapStatus === 'error'
  const allowSwap = useMemo(
    () =>
      !confirmSwapIsLoading &&
      !exchangeRateUpdatePending &&
      Object.values(parsedSwapAmount).every((amount) => amount.gt(0)),
    [parsedSwapAmount, exchangeRateUpdatePending, confirmSwapIsLoading]
  )

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
    // This variable is intentionally left out of the dependency array
    // so that the error message is cleared only when the user changes the input
    if (confirmSwapFailed) {
      // Basically clears the error message
      setStartedSwapId(null)
    }
    // since we use the calculated exchange rate to update the parsedSwapAmount,
    // this hook will be triggered after the exchange rate is first updated. this
    // variable prevents the exchange rate from needlessly being calculated
    // again.
    const exchangeRateKnown =
      fromToken &&
      toToken &&
      exchangeRate &&
      exchangeRate.toTokenId === toToken.tokenId &&
      exchangeRate.fromTokenId === fromToken.tokenId &&
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
    if (shouldShowMaxSwapAmountWarning && fromToken?.symbol !== 'CELO') {
      setShouldShowMaxSwapAmountWarning(false)
    }
  }, [fromToken, shouldShowMaxSwapAmountWarning])

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

      const fromToken = tokensById[exchangeRate.fromTokenId]
      const toToken = tokensById[exchangeRate.toTokenId]

      if (!fromToken || !toToken) {
        // Should never happen
        Logger.error(TAG, 'fromToken or toToken not found')
        return
      }

      if (
        !exchangeRate.estimatedPriceImpact ||
        exchangeRate.estimatedPriceImpact.gte(priceImpactWarningThreshold)
      ) {
        ValoraAnalytics.track(SwapEvents.swap_price_impact_warning_displayed, {
          toToken: toToken.address,
          toTokenId: toToken.tokenId,
          toTokenNetworkId: toToken.networkId,
          fromToken: fromToken.address,
          fromTokenId: fromToken.tokenId,
          fromTokenNetworkId: fromToken?.networkId,
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

  const handleConfirmSwap = () => {
    if (!exchangeRate) {
      return // this should never happen, because the button must be disabled in that cases
    }

    const fromToken = tokensById[exchangeRate.fromTokenId]
    const toToken = tokensById[exchangeRate.toTokenId]

    if (!fromToken || !toToken) {
      // Should never happen
      return
    }

    if (parsedSwapAmount[Field.FROM].gt(fromTokenBalance)) {
      setFromSwapAmountError(true)
      showMaxCeloSwapWarning()
      dispatch(showError(t('swapScreen.insufficientFunds', { token: fromToken.symbol })))
      return
    }

    const userInput = {
      toTokenId: toToken.tokenId,
      fromTokenId: fromToken.tokenId,
      swapAmount: {
        [Field.FROM]: parsedSwapAmount[Field.FROM].toString(),
        [Field.TO]: parsedSwapAmount[Field.TO].toString(),
      },
      updatedField,
    }

    const swapAmountDecimals = updatedField === Field.FROM ? toToken.decimals : fromToken.decimals
    const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
    const { estimatedPriceImpact, price, allowanceTarget } =
      exchangeRate.rawSwapResponse.unvalidatedSwapTransaction

    if (useViemForSwap) {
      if (!exchangeRate?.preparedTransactions) {
        // Error already shown, do nothing
        return
      }

      const resultType = exchangeRate.preparedTransactions.type
      switch (resultType) {
        case 'need-decrease-spend-amount-for-gas': // fallthrough on purpose
        case 'not-enough-balance-for-gas':
          preparedTransactionsReviewBottomSheetRef.current?.snapToIndex(0)
          break
        case 'possible':
          ValoraAnalytics.track(SwapEvents.swap_review_submit, {
            toToken: toToken.address,
            toTokenId: toToken.tokenId,
            toTokenNetworkId: toToken.networkId,
            fromToken: fromToken.address,
            fromTokenId: fromToken.tokenId,
            fromTokenNetworkId: fromToken.networkId,
            amount: swapAmount[updatedField],
            amountType: swapAmountParam,
            usdTotal: exchangeRate.swapAmount.multipliedBy(exchangeRate.price).toNumber(),
            allowanceTarget,
            estimatedPriceImpact,
            price,
            provider: exchangeRate.provider,
            web3Library: 'viem',
            ...getSwapTxsAnalyticsProperties(
              exchangeRate.preparedTransactions.transactions,
              fromToken.networkId,
              tokensById
            ),
          })

          const swapId = uuidv4()
          setStartedSwapId(swapId)
          dispatch(
            swapStartPrepared({
              swapId,
              quote: {
                preparedTransactions: getSerializablePreparedTransactions(
                  exchangeRate.preparedTransactions.transactions
                ),
                receivedAt: exchangeRate.receivedAt,
                rawSwapResponse: exchangeRate.rawSwapResponse,
              },
              userInput,
            })
          )
          break
        default:
          // To catch any missing cases at compile time
          const assertNever: never = resultType
          return assertNever
      }

      return
    }

    // Legacy

    const swapResponse = exchangeRate.rawSwapResponse

    ValoraAnalytics.track(SwapEvents.swap_review_submit, {
      toToken: toToken.address,
      toTokenId: toToken.tokenId,
      toTokenNetworkId: toToken.networkId,
      fromToken: fromToken.address,
      fromTokenId: fromToken.tokenId,
      fromTokenNetworkId: fromToken.networkId,
      amount: swapAmount[updatedField],
      amountType: swapAmountParam,
      usdTotal: new BigNumber(swapResponse.unvalidatedSwapTransaction[swapAmountParam])
        .shiftedBy(-swapAmountDecimals)
        .multipliedBy(swapResponse.unvalidatedSwapTransaction.price)
        .toNumber(),
      allowanceTarget,
      estimatedPriceImpact,
      price,
      provider: swapResponse.details.swapProvider,
      web3Library: 'contract-kit',
    })

    const swapId = uuidv4()
    setStartedSwapId(swapId)
    dispatch(
      swapStart({
        ...exchangeRate.rawSwapResponse,
        userInput,
        quoteReceivedAt: exchangeRate.receivedAt,
        swapId,
      })
    )
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

  const handleSelectToken = (selectedToken: TokenBalance) => {
    if (selectedToken && selectingToken) {
      ValoraAnalytics.track(SwapEvents.swap_screen_confirm_token, {
        fieldType: selectingToken,
        tokenSymbol: selectedToken.symbol,
        tokenId: selectedToken.tokenId,
        tokenNetworkId: selectedToken.networkId,
      })
    }

    if (
      (selectingToken === Field.FROM && toToken?.tokenId === selectedToken.tokenId) ||
      (selectingToken === Field.TO && fromToken?.tokenId === selectedToken.tokenId)
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

    setShouldShowMaxSwapAmountWarning(false)
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
    if (!fromToken) {
      // Should never happen
      return
    }
    ValoraAnalytics.track(SwapEvents.swap_screen_max_swap_amount, {
      tokenSymbol: fromToken.symbol,
      tokenId: fromToken.tokenId,
      tokenNetworkId: fromToken.networkId,
    })
  }

  const showMaxCeloSwapWarning = () => {
    if (fromToken?.symbol === 'CELO') {
      setShouldShowMaxSwapAmountWarning(true)
    }
  }

  const onPressLearnMore = () => {
    ValoraAnalytics.track(SwapEvents.swap_learn_more)
    navigate(Screens.WebViewScreen, { uri: SWAP_LEARN_MORE })
  }

  const onPressLearnMoreFees = () => {
    ValoraAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    navigate(Screens.WebViewScreen, { uri: TRANSACTION_FEES_LEARN_MORE })
  }

  const showMaxSwapAmountWarning = !confirmSwapFailed && shouldShowMaxSwapAmountWarning
  const showPriceImpactWarning =
    !confirmSwapFailed &&
    !exchangeRateUpdatePending &&
    !!exchangeRate?.estimatedPriceImpact?.gte(priceImpactWarningThreshold)
  const showMissingPriceImpactWarning =
    !confirmSwapFailed &&
    !exchangeRateUpdatePending &&
    !showPriceImpactWarning &&
    ((exchangeRate && !exchangeRate.estimatedPriceImpact) ||
      (fromToken && toToken && (!fromToken.priceUsd || !toToken.priceUsd)))

  const { networkFee, feeTokenId } = useMemo(() => {
    return getNetworkFee(exchangeRate, fromToken?.networkId)
  }, [fromToken, exchangeRate])

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader
        style={{ paddingHorizontal: variables.contentPadding }}
        left={<BackButton />}
        title={t('swapScreen.title')}
      />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.swapAmountsContainer}>
          <SwapAmountInput
            label={t('swapScreen.swapFrom')}
            onInputChange={handleChangeAmount(Field.FROM)}
            inputValue={swapAmount[Field.FROM]}
            parsedInputValue={parsedSwapAmount[Field.FROM]}
            onSelectToken={handleShowTokenSelect(Field.FROM)}
            token={fromToken}
            style={styles.fromSwapAmountInput}
            loading={updatedField === Field.TO && exchangeRateUpdatePending}
            autoFocus
            inputError={fromSwapAmountError}
            onPressMax={handleSetMaxFromAmount}
            buttonPlaceholder={t('swapScreen.swapFromTokenSelection')}
          />
          <SwapAmountInput
            label={t('swapScreen.swapTo')}
            onInputChange={handleChangeAmount(Field.TO)}
            parsedInputValue={parsedSwapAmount[Field.TO]}
            inputValue={swapAmount[Field.TO]}
            onSelectToken={handleShowTokenSelect(Field.TO)}
            token={toToken}
            style={styles.toSwapAmountInput}
            loading={updatedField === Field.FROM && exchangeRateUpdatePending}
            buttonPlaceholder={t('swapScreen.swapToTokenSelection')}
            editable={swapBuyAmountEnabled}
          />

          <SwapTransactionDetails
            networkFee={networkFee}
            networkFeeInfoBottomSheetRef={networkFeeInfoBottomSheetRef}
            feeTokenId={feeTokenId}
            slippagePercentage={parsedSlippagePercentage}
            fromToken={fromToken}
            toToken={toToken}
            exchangeRatePrice={exchangeRate?.price}
            swapAmount={parsedSwapAmount[Field.FROM]}
            fetchingSwapQuote={exchangeRateUpdatePending}
          />

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
          {confirmSwapFailed && (
            <InLineNotification
              severity={Severity.Warning}
              title={t('swapScreen.confirmSwapFailedWarning.title')}
              description={t('swapScreen.confirmSwapFailedWarning.body')}
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
          testID="ConfirmSwapButton"
          onPress={handleConfirmSwap}
          text={t('swapScreen.confirmSwap')}
          size={BtnSizes.FULL}
          disabled={!allowSwap}
          showLoading={confirmSwapIsLoading}
        />
      </ScrollView>
      <TokenBottomSheet
        forwardedRef={tokenBottomSheetRef}
        snapPoints={['90%']}
        origin={TokenPickerOrigin.Swap}
        onTokenSelected={handleSelectToken}
        searchEnabled={true}
        tokens={supportedTokens}
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
    color: colors.primary,
  },
  warning: {
    marginTop: Spacing.Thick24,
  },
  bottomSheetButton: {
    marginTop: Spacing.Thick24,
  },
})

export default SwapScreen
