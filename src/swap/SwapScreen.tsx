import { parseInputAmount } from '@celo/utils/lib/parsing'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useReducer, useRef } from 'react'
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
import BottomSheetInLineNotification from 'src/components/BottomSheetInLineNotification'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
import TokenBottomSheet, {
  TokenBalanceItemOption,
  TokenPickerOrigin,
} from 'src/components/TokenBottomSheet'
import CustomHeader from 'src/components/header/CustomHeader'
import { SWAP_LEARN_MORE } from 'src/config'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams, getExperimentParams } from 'src/statsig'
import { DynamicConfigs, ExperimentConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import PreparedTransactionsReviewBottomSheet from 'src/swap/PreparedTransactionsReviewBottomSheet'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import { getSwapTxsAnalyticsProperties } from 'src/swap/getSwapTxsAnalyticsProperties'
import { currentSwapSelector, priceImpactWarningThresholdSelector } from 'src/swap/selectors'
import { swapStart } from 'src/swap/slice'
import { Field, SwapAmount } from 'src/swap/types'
import useFilterChips from 'src/swap/useFilterChips'
import useSwapQuote, { QuoteResult } from 'src/swap/useSwapQuote'
import { useSwappableTokens, useTokenInfo, useTokensWithTokenBalance } from 'src/tokens/hooks'
import { feeCurrenciesWithPositiveBalancesSelector, tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap, getTokenId } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import networkConfig from 'src/web3/networkConfig'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'SwapScreen'

const FETCH_UPDATED_QUOTE_DEBOUNCE_TIME = 200
const DEFAULT_INPUT_SWAP_AMOUNT: SwapAmount = {
  [Field.FROM]: '',
  [Field.TO]: '',
}

interface SwapState {
  fromTokenId: string | undefined
  toTokenId: string | undefined
  // Raw input values (can contain region specific decimal separators)
  inputSwapAmount: SwapAmount
  updatedField: Field
  selectingField: Field | null
  selectingNoUsdPriceToken: TokenBalance | null
  confirmingSwap: boolean
  // Keep track of which swap is currently being executed from this screen
  // This is because there could be multiple swaps happening at the same time
  startedSwapId: string | null
  switchedToNetworkId: NetworkId | null
}

function getInitialState(fromTokenId?: string): SwapState {
  return {
    fromTokenId,
    toTokenId: undefined,
    inputSwapAmount: DEFAULT_INPUT_SWAP_AMOUNT,
    updatedField: Field.FROM,
    selectingField: null,
    selectingNoUsdPriceToken: null,
    confirmingSwap: false,
    startedSwapId: null,
    switchedToNetworkId: null,
  }
}

const swapSlice = createSlice({
  name: 'swapSlice',
  initialState: getInitialState,
  reducers: {
    changeAmount: (state, action: PayloadAction<{ field: Field; value: string }>) => {
      const { field, value } = action.payload
      state.confirmingSwap = false
      state.startedSwapId = null
      state.updatedField = field
      if (!value) {
        state.inputSwapAmount = DEFAULT_INPUT_SWAP_AMOUNT
        return
      }
      // Regex to match only numbers and one decimal separator
      const sanitizedValue = value.match(/^(?:\d+[.,]?\d*|[.,]\d*|[.,])$/)?.join('')
      if (!sanitizedValue) {
        return
      }
      state.inputSwapAmount[field] = sanitizedValue
    },
    chooseMaxFromAmount: (state, action: PayloadAction<{ fromTokenBalance: BigNumber }>) => {
      const { fromTokenBalance } = action.payload
      state.confirmingSwap = false
      state.startedSwapId = null
      state.updatedField = Field.FROM
      // We try the current balance first, and we will prompt the user if it's too high
      state.inputSwapAmount[Field.FROM] = fromTokenBalance.toFormat({
        decimalSeparator: getNumberFormatSettings().decimalSeparator,
      })
    },
    startSelectToken: (state, action: PayloadAction<{ fieldType: Field }>) => {
      state.selectingField = action.payload.fieldType
      state.confirmingSwap = false
    },
    selectNoUsdPriceToken: (state, action: PayloadAction<{ token: TokenBalance }>) => {
      state.selectingNoUsdPriceToken = action.payload.token
    },
    unselectNoUsdPriceToken: (state) => {
      state.selectingNoUsdPriceToken = null
    },
    selectTokens: (
      state,
      action: PayloadAction<{
        fromTokenId: string | undefined
        toTokenId: string | undefined
        switchedToNetworkId: NetworkId | null
      }>
    ) => {
      const { fromTokenId, toTokenId, switchedToNetworkId } = action.payload
      state.confirmingSwap = false
      if (fromTokenId !== state.fromTokenId || toTokenId !== state.toTokenId) {
        state.startedSwapId = null
      }
      state.fromTokenId = fromTokenId
      state.toTokenId = toTokenId
      state.switchedToNetworkId = switchedToNetworkId
      state.selectingNoUsdPriceToken = null
    },
    quoteUpdated: (state, action: PayloadAction<{ quote: QuoteResult | null }>) => {
      const { quote } = action.payload
      const { updatedField } = state
      state.confirmingSwap = false
      const otherField = updatedField === Field.FROM ? Field.TO : Field.FROM
      if (!quote) {
        state.inputSwapAmount[otherField] = ''
        return
      }

      const { decimalSeparator } = getNumberFormatSettings()
      const parsedAmount = parseInputAmount(state.inputSwapAmount[updatedField], decimalSeparator)

      const newAmount = parsedAmount.multipliedBy(
        new BigNumber(quote.price).pow(updatedField === Field.FROM ? 1 : -1)
      )
      state.inputSwapAmount[otherField] = newAmount.toFormat({
        decimalSeparator,
      })
    },
    // When the user presses the confirm swap button
    startConfirmSwap: (state) => {
      state.confirmingSwap = true
    },
    // When the swap is ready to be executed
    startSwap: (state, action: PayloadAction<{ swapId: string }>) => {
      state.startedSwapId = action.payload.swapId
    },
  },
})

const {
  changeAmount,
  chooseMaxFromAmount,
  startSelectToken,
  selectTokens,
  quoteUpdated,
  startConfirmSwap,
  startSwap,
  selectNoUsdPriceToken,
  unselectNoUsdPriceToken,
} = swapSlice.actions

const swapStateReducer = swapSlice.reducer

function getNetworkFee(quote: QuoteResult | null, networkId?: NetworkId) {
  const { feeCurrency, maxFeeAmount, estimatedFeeAmount } = getFeeCurrencyAndAmounts(
    quote?.preparedTransactions
  )
  return {
    feeTokenId: feeCurrency?.tokenId ?? getTokenId(networkId ?? networkConfig.defaultNetworkId), // native token
    maxNetworkFee: maxFeeAmount,
    estimatedNetworkFee: estimatedFeeAmount,
  }
}

type Props = NativeStackScreenProps<StackParamList, Screens.SwapScreenWithBack>

export function SwapScreen({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const tokenBottomSheetFromRef = useRef<BottomSheetRefType>(null)
  const tokenBottomSheetToRef = useRef<BottomSheetRefType>(null)
  const tokenBottomSheetRefs = {
    [Field.FROM]: tokenBottomSheetFromRef,
    [Field.TO]: tokenBottomSheetToRef,
  }
  const preparedTransactionsReviewBottomSheetRef = useRef<BottomSheetRefType>(null)
  const networkFeeInfoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const slippageInfoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const fundYourWalletBottomSheetRef = useRef<BottomSheetRefType>(null)
  const tokensWithBalance = useTokensWithTokenBalance()

  const { decimalSeparator } = getNumberFormatSettings()

  const { swapBuyAmountEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.SWAP_BUY_AMOUNT]
  )
  const slippagePercentage = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  ).maxSlippagePercentage
  const parsedSlippagePercentage = new BigNumber(slippagePercentage).toFormat()

  const { swappableFromTokens, swappableToTokens, areSwapTokensShuffled } = useSwappableTokens()

  const priceImpactWarningThreshold = useSelector(priceImpactWarningThresholdSelector)

  const tokensById = useSelector((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )

  const initialFromTokenId = route.params?.fromTokenId
  const [state, localDispatch] = useReducer(swapStateReducer, getInitialState(initialFromTokenId))
  const {
    fromTokenId,
    toTokenId,
    inputSwapAmount,
    updatedField,
    selectingField,
    selectingNoUsdPriceToken,
    confirmingSwap,
    switchedToNetworkId,
    startedSwapId,
  } = state

  const filterChipsFrom = useFilterChips(Field.FROM)
  const filterChipsTo = useFilterChips(Field.TO)

  const { fromToken, toToken } = useMemo(() => {
    const fromToken = swappableFromTokens.find((token) => token.tokenId === fromTokenId)
    const toToken = swappableToTokens.find((token) => token.tokenId === toTokenId)
    return { fromToken, toToken }
  }, [fromTokenId, toTokenId, swappableFromTokens, swappableToTokens])

  const fromTokenBalance = useTokenInfo(fromToken?.tokenId)?.balance ?? new BigNumber(0)

  const currentSwap = useSelector(currentSwapSelector)
  const swapStatus = startedSwapId === currentSwap?.id ? currentSwap.status : null

  const feeCurrenciesWithPositiveBalances = useSelector((state) =>
    feeCurrenciesWithPositiveBalancesSelector(
      state,
      fromToken?.networkId || networkConfig.defaultNetworkId
    )
  )
  const localCurrency = useSelector(getLocalCurrencyCode)

  const { quote, refreshQuote, fetchSwapQuoteError, fetchingSwapQuote, clearQuote } = useSwapQuote(
    fromToken?.networkId || networkConfig.defaultNetworkId,
    slippagePercentage
  )

  // Parsed swap amounts (BigNumber)
  const parsedSwapAmount = useMemo(
    () => ({
      [Field.FROM]: parseInputAmount(inputSwapAmount[Field.FROM], decimalSeparator),
      [Field.TO]: parseInputAmount(inputSwapAmount[Field.TO], decimalSeparator),
    }),
    [inputSwapAmount]
  )

  const shouldShowMaxSwapAmountWarning =
    feeCurrenciesWithPositiveBalances.length === 1 &&
    fromToken?.tokenId === feeCurrenciesWithPositiveBalances[0].tokenId &&
    fromTokenBalance.gt(0) &&
    parsedSwapAmount[Field.FROM].gte(fromTokenBalance)

  const fromSwapAmountError = confirmingSwap && parsedSwapAmount[Field.FROM].gt(fromTokenBalance)

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

  useEffect(() => {
    localDispatch(quoteUpdated({ quote }))
  }, [quote])

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

    localDispatch(startConfirmSwap())

    if (tokensWithBalance.length === 0) {
      ValoraAnalytics.track(SwapEvents.swap_show_fund_your_wallet)
      fundYourWalletBottomSheetRef.current?.snapToIndex(0)
      return
    }

    if (parsedSwapAmount[Field.FROM].gt(fromTokenBalance)) {
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
          amount: inputSwapAmount[updatedField],
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
        localDispatch(startSwap({ swapId }))
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
    localDispatch(startSelectToken({ fieldType }))

    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingField value is updated, so that the title of the
    // bottom sheet (which depends on selectingField) does not change on the
    // screen
    requestAnimationFrame(() => {
      tokenBottomSheetRefs[fieldType].current?.snapToIndex(0)
    })
  }

  const handleConfirmSelectToken = (selectedToken: TokenBalance) => {
    if (!selectingField) {
      // Should never happen
      Logger.error(TAG, 'handleSelectToken called without selectingField')
      return
    }

    let newSwitchedToNetworkId: NetworkId | null = null
    let newFromToken = fromToken
    let newToToken = toToken

    if (
      (selectingField === Field.FROM && toToken?.tokenId === selectedToken.tokenId) ||
      (selectingField === Field.TO && fromToken?.tokenId === selectedToken.tokenId)
    ) {
      newFromToken = toToken
      newToToken = fromToken
    } else if (selectingField === Field.FROM) {
      newFromToken = selectedToken
      newSwitchedToNetworkId =
        toToken && toToken.networkId !== newFromToken.networkId ? newFromToken.networkId : null
      if (newSwitchedToNetworkId) {
        // reset the toToken if the user is switching networks
        newToToken = undefined
      }
    } else if (selectingField === Field.TO) {
      newToToken = selectedToken
      newSwitchedToNetworkId =
        fromToken && fromToken.networkId !== newToToken.networkId ? newToToken.networkId : null
      if (newSwitchedToNetworkId) {
        // reset the fromToken if the user is switching networks
        newFromToken = undefined
      }
    }

    ValoraAnalytics.track(SwapEvents.swap_screen_confirm_token, {
      fieldType: selectingField,
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
      areSwapTokensShuffled,
    })

    localDispatch(
      selectTokens({
        fromTokenId: newFromToken?.tokenId,
        toTokenId: newToToken?.tokenId,
        switchedToNetworkId: newSwitchedToNetworkId,
      })
    )

    if (newSwitchedToNetworkId) {
      clearQuote()
    }

    // use requestAnimationFrame so that the bottom sheet and keyboard dismiss
    // animation can be synchronised and starts after the state changes above.
    // without this, the keyboard animation lags behind the state updates while
    // the bottom sheet does not
    requestAnimationFrame(() => {
      tokenBottomSheetRefs[selectingField].current?.close()
    })
  }

  const handleConfirmSelectTokenNoUsdPrice = () => {
    if (selectingNoUsdPriceToken) {
      handleConfirmSelectToken(selectingNoUsdPriceToken)
    }
  }

  const handleDismissSelectTokenNoUsdPrice = () => {
    localDispatch(unselectNoUsdPriceToken())
  }

  const handleSelectToken = (selectedToken: TokenBalance) => {
    if (!selectedToken.priceUsd && selectingField === Field.TO) {
      localDispatch(selectNoUsdPriceToken({ token: selectedToken }))
      return
    }

    handleConfirmSelectToken(selectedToken)
  }

  const handleChangeAmount = (fieldType: Field) => (value: string) => {
    localDispatch(changeAmount({ field: fieldType, value }))
    if (!value) {
      clearQuote()
    }
  }

  const handleSetMaxFromAmount = () => {
    localDispatch(chooseMaxFromAmount({ fromTokenBalance }))
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
  const showNoUsdPriceWarning =
    !confirmSwapFailed && !quoteUpdatePending && toToken && !toToken.priceUsd
  const showPriceImpactWarning =
    !confirmSwapFailed &&
    !quoteUpdatePending &&
    !showNoUsdPriceWarning &&
    (quote?.estimatedPriceImpact
      ? new BigNumber(quote.estimatedPriceImpact).gte(priceImpactWarningThreshold)
      : false)
  const showMissingPriceImpactWarning =
    !confirmSwapFailed &&
    !quoteUpdatePending &&
    !showPriceImpactWarning &&
    !showNoUsdPriceWarning &&
    quote &&
    !quote.estimatedPriceImpact

  const { feeTokenId, maxNetworkFee, estimatedNetworkFee } = useMemo(() => {
    return getNetworkFee(quote, fromToken?.networkId)
  }, [fromToken, quote])

  useEffect(() => {
    if (showPriceImpactWarning || showMissingPriceImpactWarning) {
      if (!quote) {
        return
      }
      const fromToken = tokensById[quote.fromTokenId]
      const toToken = tokensById[quote.toTokenId]

      if (!fromToken || !toToken) {
        // Should never happen
        Logger.error(TAG, 'fromToken or toToken not found')
        return
      }

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
  }, [showPriceImpactWarning || showMissingPriceImpactWarning])

  const tokenBottomSheetsConfig = [
    {
      fieldType: Field.FROM,
      tokens: swappableFromTokens,
      title: t('swapScreen.swapFromTokenSelection'),
      filterChips: filterChipsFrom,
      origin: TokenPickerOrigin.SwapFrom,
    },
    {
      fieldType: Field.TO,
      tokens: swappableToTokens,
      title: t('swapScreen.swapToTokenSelection'),
      filterChips: filterChipsTo,
      origin: TokenPickerOrigin.SwapTo,
    },
  ]

  return (
    <SafeAreaView style={styles.safeAreaContainer} testID="SwapScreen">
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
            inputValue={inputSwapAmount[Field.FROM]}
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
            inputValue={inputSwapAmount[Field.TO]}
            onSelectToken={handleShowTokenSelect(Field.TO)}
            token={toToken}
            style={styles.toSwapAmountInput}
            loading={updatedField === Field.FROM && quoteUpdatePending}
            buttonPlaceholder={t('swapScreen.swapToTokenSelection')}
            editable={swapBuyAmountEnabled}
          />

          <SwapTransactionDetails
            maxNetworkFee={maxNetworkFee}
            estimatedNetworkFee={estimatedNetworkFee}
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
                context: selectingField === Field.FROM ? 'swapTo' : 'swapFrom',
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
          {showNoUsdPriceWarning && (
            <InLineNotification
              severity={Severity.Warning}
              title={t('swapScreen.noUsdPriceWarning.title', { localCurrency })}
              description={t('swapScreen.noUsdPriceWarning.description', {
                localCurrency,
                tokenSymbol: toToken?.symbol,
              })}
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
      {tokenBottomSheetsConfig.map(({ fieldType, tokens, title, filterChips, origin }) => (
        <TokenBottomSheet
          key={`TokenBottomSheet/${fieldType}`}
          forwardedRef={tokenBottomSheetRefs[fieldType]}
          tokens={tokens}
          title={title}
          filterChips={filterChips}
          origin={origin}
          snapPoints={['90%']}
          onTokenSelected={handleSelectToken}
          searchEnabled={true}
          TokenOptionComponent={TokenBalanceItemOption}
          showPriceUsdUnavailableWarning={true}
          areSwapTokensShuffled={areSwapTokensShuffled}
        />
      ))}
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
        description={t('swapScreen.transactionDetails.networkFeeInfoV1_76', {
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
        testId="SlippageInfoBottomSheet"
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
      <BottomSheetInLineNotification
        showNotification={!!selectingNoUsdPriceToken}
        severity={Severity.Warning}
        title={t('swapScreen.noUsdPriceWarning.title', { localCurrency })}
        description={t('swapScreen.noUsdPriceWarning.description', {
          localCurrency,
          tokenSymbol: selectingNoUsdPriceToken?.symbol,
        })}
        ctaLabel2={t('swapScreen.noUsdPriceWarning.ctaConfirm')}
        onPressCta2={handleConfirmSelectTokenNoUsdPrice}
        ctaLabel={t('swapScreen.noUsdPriceWarning.ctaDismiss')}
        onPressCta={handleDismissSelectTokenNoUsdPrice}
      />
      <BottomSheet
        forwardedRef={fundYourWalletBottomSheetRef}
        title={t('swapScreen.fundYourWalletBottomSheet.title')}
        titleStyle={styles.bottomSheetTitle}
        description={t('swapScreen.fundYourWalletBottomSheet.description')}
        testId="FundYourWalletBottomSheet"
      >
        <Button
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          style={styles.bottomSheetButton}
          onPress={() => {
            ValoraAnalytics.track(SwapEvents.swap_add_funds)
            navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
          }}
          text={t('swapScreen.fundYourWalletBottomSheet.addFundsButton')}
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
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    marginTop: -Spacing.Regular16,
  },
})

export default SwapScreen
