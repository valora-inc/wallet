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
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams, getExperimentParams } from 'src/statsig'
import { DynamicConfigs, ExperimentConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import PreparedTransactionsReviewBottomSheet from 'src/swap/PreparedTransactionsReviewBottomSheet'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import { getSwapTxsAnalyticsProperties } from 'src/swap/getSwapTxsAnalyticsProperties'
import { currentSwapSelector, priceImpactWarningThresholdSelector } from 'src/swap/selectors'
import { swapStart } from 'src/swap/slice'
import { Field, SwapAmount } from 'src/swap/types'
import useSwapQuote, { QuoteResult } from 'src/swap/useSwapQuote'
import { useSwappableTokens, useTokenInfo } from 'src/tokens/hooks'
import { feeCurrenciesWithPositiveBalancesSelector, tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap, getTokenId } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
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
  const slippageInfoBottomSheetRef = useRef<BottomSheetRefType>(null)

  const { decimalSeparator } = getNumberFormatSettings()

  const { swapBuyAmountEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.SWAP_BUY_AMOUNT]
  )
  const slippagePercentage = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  ).maxSlippagePercentage
  const parsedSlippagePercentage = new BigNumber(slippagePercentage).toFormat()

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
  const [switchedToNetworkId, setSwitchedToNetworkId] = useState<NetworkId | null>(null)

  const fromTokenBalance = useTokenInfo(fromToken?.tokenId)?.balance ?? new BigNumber(0)

  const feeCurrenciesWithPositiveBalances = useSelector((state) =>
    feeCurrenciesWithPositiveBalancesSelector(
      state,
      fromToken?.networkId || networkConfig.defaultNetworkId
    )
  )

  const { quote, refreshQuote, fetchSwapQuoteError, fetchingSwapQuote, clearQuote } = useSwapQuote(
    fromToken?.networkId || networkConfig.defaultNetworkId,
    slippagePercentage
  )

  // Parsed swap amounts (BigNumber)
  const parsedSwapAmount = useMemo(
    () => ({
      [Field.FROM]: parseInputAmount(swapAmount[Field.FROM], decimalSeparator),
      [Field.TO]: parseInputAmount(swapAmount[Field.TO], decimalSeparator),
    }),
    [swapAmount]
  )

  const quoteUpdatePending =
    (quote &&
      (quote.fromTokenId !== fromToken?.tokenId ||
        quote.toTokenId !== toToken?.tokenId ||
        !quote.swapAmount.eq(parsedSwapAmount[updatedField]))) ||
    fetchingSwapQuote

  const confirmSwapIsLoading = swapStatus === 'started'
  const confirmSwapFailed = swapStatus === 'error'
  const allowSwap = useMemo(
    () =>
      !confirmSwapIsLoading &&
      !quoteUpdatePending &&
      Object.values(parsedSwapAmount).every((amount) => amount.gt(0)),
    [parsedSwapAmount, quoteUpdatePending, confirmSwapIsLoading]
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
    // since we use the quote to update the parsedSwapAmount,
    // this hook will be triggered after the quote is first updated. this
    // variable prevents the quote from needlessly being fetched again.
    const quoteKnown =
      fromToken &&
      toToken &&
      quote &&
      quote.toTokenId === toToken.tokenId &&
      quote.fromTokenId === fromToken.tokenId &&
      quote.swapAmount.eq(parsedSwapAmount[updatedField])

    const debouncedRefreshQuote = setTimeout(() => {
      if (fromToken && toToken && parsedSwapAmount[updatedField].gt(0) && !quoteKnown) {
        void refreshQuote(fromToken, toToken, parsedSwapAmount, updatedField)
      }
    }, FETCH_UPDATED_QUOTE_DEBOUNCE_TIME)

    return () => {
      clearTimeout(debouncedRefreshQuote)
    }
  }, [fromToken, toToken, parsedSwapAmount, updatedField, quote])

  useEffect(
    () => {
      if (!quote) {
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
        new BigNumber(quote.price).pow(updatedField === Field.FROM ? 1 : -1)
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

      const fromToken = tokensById[quote.fromTokenId]
      const toToken = tokensById[quote.toTokenId]

      if (!fromToken || !toToken) {
        // Should never happen
        Logger.error(TAG, 'fromToken or toToken not found')
        return
      }

      if (
        !quote.estimatedPriceImpact ||
        new BigNumber(quote.estimatedPriceImpact).gte(priceImpactWarningThreshold)
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
          priceImpact: quote.estimatedPriceImpact,
          provider: quote.provider,
        })
      }
    },
    // We only want to update the other field when the quote changes
    // that's why we don't include the other dependencies

    [quote]
  )

  const handleConfirmSwap = () => {
    if (!quote) {
      return // this should never happen, because the button must be disabled in that cases
    }

    const fromToken = tokensById[quote.fromTokenId]
    const toToken = tokensById[quote.toTokenId]

    if (!fromToken || !toToken) {
      // Should never happen
      return
    }

    if (parsedSwapAmount[Field.FROM].gt(fromTokenBalance)) {
      setFromSwapAmountError(true)
      hideOrShowMaxFeeCurrencySwapWarning(fromToken)
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

    const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
    const { estimatedPriceImpact, price, allowanceTarget } = quote

    const resultType = quote.preparedTransactions.type
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
          allowanceTarget,
          estimatedPriceImpact,
          price,
          provider: quote.provider,
          web3Library: 'viem',
          ...getSwapTxsAnalyticsProperties(
            quote.preparedTransactions.transactions,
            fromToken.networkId,
            tokensById
          ),
        })

        const swapId = uuidv4()
        setStartedSwapId(swapId)
        dispatch(
          swapStart({
            swapId,
            quote: {
              preparedTransactions: getSerializablePreparedTransactions(
                quote.preparedTransactions.transactions
              ),
              receivedAt: quote.receivedAt,
              price: quote.price,
              provider: quote.provider,
              estimatedPriceImpact,
              allowanceTarget,
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
    if (!selectingToken) {
      // Should never happen
      Logger.error(TAG, 'handleSelectToken called without selectingToken')
      return
    }

    let newSwitchedToNetworkId: NetworkId | null = null
    let newFromToken = fromToken
    let newToToken = toToken

    if (
      (selectingToken === Field.FROM && toToken?.tokenId === selectedToken.tokenId) ||
      (selectingToken === Field.TO && fromToken?.tokenId === selectedToken.tokenId)
    ) {
      newFromToken = toToken
      newToToken = fromToken
    } else if (selectingToken === Field.FROM) {
      newFromToken = selectedToken
      newSwitchedToNetworkId =
        toToken && toToken.networkId !== newFromToken.networkId ? newFromToken.networkId : null
      if (newSwitchedToNetworkId) {
        // reset the toToken if the user is switching networks
        newToToken = undefined
      }
    } else if (selectingToken === Field.TO) {
      newToToken = selectedToken
      newSwitchedToNetworkId =
        fromToken && fromToken.networkId !== newToToken.networkId ? newToToken.networkId : null
      if (newSwitchedToNetworkId) {
        // reset the fromToken if the user is switching networks
        newFromToken = undefined
      }
    }

    ValoraAnalytics.track(SwapEvents.swap_screen_confirm_token, {
      fieldType: selectingToken,
      tokenSymbol: selectedToken.symbol,
      tokenId: selectedToken.tokenId,
      tokenNetworkId: selectedToken.networkId,
      fromTokenSymbol: newFromToken?.symbol,
      fromTokenId: newFromToken?.tokenId,
      fromTokenNetworkId: newFromToken?.networkId,
      toTokenSymbol: newToToken?.symbol,
      toTokenId: newToToken?.tokenId,
      toTokenNetworkId: newToToken?.networkId,
      switchedNetworkId: !!newSwitchedToNetworkId,
    })

    setFromToken(newFromToken)
    setToToken(newToToken)
    setSwitchedToNetworkId(newSwitchedToNetworkId)
    hideOrShowMaxFeeCurrencySwapWarning(shouldShowMaxSwapAmountWarning ? newFromToken : undefined)

    if (newSwitchedToNetworkId) {
      clearQuote()
    }

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
      [Field.FROM]:
        // We try the current balance first, and we will prompt the user if it's too high
        fromTokenBalance.toFormat({
          decimalSeparator,
        }),
    }))
    hideOrShowMaxFeeCurrencySwapWarning(fromToken)
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

  const hideOrShowMaxFeeCurrencySwapWarning = (fromToken: TokenBalance | undefined) => {
    setShouldShowMaxSwapAmountWarning(
      feeCurrenciesWithPositiveBalances.length === 1 &&
        fromToken?.tokenId === feeCurrenciesWithPositiveBalances[0].tokenId
    )
  }

  const onPressLearnMore = () => {
    ValoraAnalytics.track(SwapEvents.swap_learn_more)
    navigate(Screens.WebViewScreen, { uri: SWAP_LEARN_MORE })
  }

  const onPressLearnMoreFees = () => {
    ValoraAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    navigate(Screens.WebViewScreen, { uri: TRANSACTION_FEES_LEARN_MORE })
  }

  const showSwitchedToNetworkWarning = !!switchedToNetworkId
  const switchedToNetworkName = switchedToNetworkId && NETWORK_NAMES[switchedToNetworkId]
  const showMaxSwapAmountWarning =
    !confirmSwapFailed && !showSwitchedToNetworkWarning && shouldShowMaxSwapAmountWarning
  const showPriceImpactWarning =
    !confirmSwapFailed &&
    !quoteUpdatePending &&
    (quote?.estimatedPriceImpact
      ? new BigNumber(quote.estimatedPriceImpact).gte(priceImpactWarningThreshold)
      : false)
  const showMissingPriceImpactWarning =
    !confirmSwapFailed &&
    !quoteUpdatePending &&
    !showPriceImpactWarning &&
    ((quote && !quote.estimatedPriceImpact) ||
      (fromToken && toToken && (!fromToken.priceUsd || !toToken.priceUsd)))

  const { networkFee, feeTokenId } = useMemo(() => {
    return getNetworkFee(quote, fromToken?.networkId)
  }, [fromToken, quote])

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
            loading={updatedField === Field.TO && quoteUpdatePending}
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
            loading={updatedField === Field.FROM && quoteUpdatePending}
            buttonPlaceholder={t('swapScreen.swapToTokenSelection')}
            editable={swapBuyAmountEnabled}
          />

          <SwapTransactionDetails
            networkFee={networkFee}
            networkFeeInfoBottomSheetRef={networkFeeInfoBottomSheetRef}
            slippageInfoBottomSheetRef={slippageInfoBottomSheetRef}
            feeTokenId={feeTokenId}
            slippagePercentage={parsedSlippagePercentage}
            fromToken={fromToken}
            toToken={toToken}
            exchangeRatePrice={quote?.price}
            swapAmount={parsedSwapAmount[Field.FROM]}
            fetchingSwapQuote={quoteUpdatePending}
          />
          {showSwitchedToNetworkWarning && (
            <InLineNotification
              severity={Severity.Informational}
              title={t('swapScreen.switchedToNetworkWarning.title', {
                networkName: switchedToNetworkName,
              })}
              description={t('swapScreen.switchedToNetworkWarning.body', {
                networkName: switchedToNetworkName,
                context: selectingToken === Field.FROM ? 'swapTo' : 'swapFrom',
              })}
              style={styles.warning}
              testID="SwitchedToNetworkWarning"
            />
          )}
          {showMaxSwapAmountWarning && (
            <InLineNotification
              severity={Severity.Warning}
              title={t('swapScreen.maxSwapAmountWarning.titleV1_74', {
                tokenSymbol: fromToken?.symbol,
              })}
              description={t('swapScreen.maxSwapAmountWarning.bodyV1_74', {
                tokenSymbol: fromToken?.symbol,
              })}
              ctaLabel={t('swapScreen.maxSwapAmountWarning.learnMore')}
              style={styles.warning}
              onPressCta={onPressLearnMoreFees}
              testID="MaxSwapAmountWarning"
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
      {quote?.preparedTransactions && (
        <PreparedTransactionsReviewBottomSheet
          forwardedRef={preparedTransactionsReviewBottomSheetRef}
          preparedTransactions={quote.preparedTransactions}
          onAcceptDecreaseSwapAmountForGas={({ decreasedSpendAmount }) => {
            handleChangeAmount(updatedField)(
              // ensure units are for the asset whose amount is being selected by the user
              (updatedField === Field.FROM
                ? decreasedSpendAmount
                : decreasedSpendAmount.times(quote.price)
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
      <BottomSheet
        forwardedRef={slippageInfoBottomSheetRef}
        description={t('swapScreen.transactionDetails.slippageToleranceInfo')}
        testId="NetworkFeeInfoBottomSheet"
      >
        <Button
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.bottomSheetButton}
          onPress={() => {
            slippageInfoBottomSheetRef.current?.close()
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
