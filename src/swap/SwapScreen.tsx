import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useReducer, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SwapEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { TRANSACTION_FEES_LEARN_MORE } from 'src/brandingConfig'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import { SWAP_LEARN_MORE } from 'src/config'
import ArrowDown from 'src/icons/ArrowDown'
import CircledIcon from 'src/icons/CircledIcon'
import CrossChainIndicator from 'src/icons/CrossChainIndicator'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import FeeInfoBottomSheet from 'src/swap/FeeInfoBottomSheet'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import getCrossChainFee from 'src/swap/getCrossChainFee'
import { getSwapTxsAnalyticsProperties } from 'src/swap/getSwapTxsAnalyticsProperties'
import { currentSwapSelector, priceImpactWarningThresholdSelector } from 'src/swap/selectors'
import { swapStart } from 'src/swap/slice'
import { AppFeeAmount, Field, SwapAmount, SwapFeeAmount } from 'src/swap/types'
import useFilterChips from 'src/swap/useFilterChips'
import useSwapQuote, { NO_QUOTE_ERROR_MESSAGE, QuoteResult } from 'src/swap/useSwapQuote'
import { useSwappableTokens, useTokenInfo } from 'src/tokens/hooks'
import {
  feeCurrenciesSelector,
  feeCurrenciesWithPositiveBalancesSelector,
  tokensByIdSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { parseInputAmount } from 'src/utils/parsing'
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

type SelectingNoUsdPriceToken = TokenBalance & {
  tokenPositionInList: number
}
interface SwapState {
  fromTokenId: string | undefined
  toTokenId: string | undefined
  // Raw input values (can contain region specific decimal separators)
  inputSwapAmount: SwapAmount
  selectingField: Field | null
  selectingNoUsdPriceToken: SelectingNoUsdPriceToken | null
  confirmingSwap: boolean
  // Keep track of which swap is currently being executed from this screen
  // This is because there could be multiple swaps happening at the same time
  startedSwapId: string | null
  switchedToNetworkId: NetworkId | null
}

function getInitialState(fromTokenId?: string, toTokenId?: string): SwapState {
  return {
    fromTokenId,
    toTokenId,
    inputSwapAmount: DEFAULT_INPUT_SWAP_AMOUNT,
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
    changeAmount: (state, action: PayloadAction<{ value: string }>) => {
      const { value } = action.payload
      state.confirmingSwap = false
      state.startedSwapId = null
      if (!value) {
        state.inputSwapAmount = DEFAULT_INPUT_SWAP_AMOUNT
        return
      }
      // Regex to match only numbers and one decimal separator
      const sanitizedValue = value.match(/^(?:\d+[.,]?\d*|[.,]\d*|[.,])$/)?.join('')
      if (!sanitizedValue) {
        return
      }
      state.inputSwapAmount[Field.FROM] = sanitizedValue
    },
    chooseMaxFromAmount: (state, action: PayloadAction<{ fromTokenBalance: BigNumber }>) => {
      const { fromTokenBalance } = action.payload
      state.confirmingSwap = false
      state.startedSwapId = null
      // We try the current balance first, and we will prompt the user if it's too high
      state.inputSwapAmount[Field.FROM] = fromTokenBalance.toFormat({
        decimalSeparator: getNumberFormatSettings().decimalSeparator,
      })
    },
    startSelectToken: (state, action: PayloadAction<{ fieldType: Field }>) => {
      state.selectingField = action.payload.fieldType
      state.confirmingSwap = false
    },
    selectNoUsdPriceToken: (
      state,
      action: PayloadAction<{
        token: SelectingNoUsdPriceToken
      }>
    ) => {
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
      state.confirmingSwap = false
      if (!quote) {
        state.inputSwapAmount[Field.TO] = ''
        return
      }

      const { decimalSeparator } = getNumberFormatSettings()
      const parsedAmount = parseInputAmount(state.inputSwapAmount[Field.FROM], decimalSeparator)

      const newAmount = parsedAmount.multipliedBy(new BigNumber(quote.price))
      state.inputSwapAmount[Field.TO] = newAmount.toFormat({
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

function getNetworkFee(quote: QuoteResult | null) {
  const { feeCurrency, maxFeeAmount, estimatedFeeAmount } = getFeeCurrencyAndAmounts(
    quote?.preparedTransactions
  )
  return feeCurrency && estimatedFeeAmount
    ? {
        token: feeCurrency,
        maxAmount: maxFeeAmount,
        amount: estimatedFeeAmount,
      }
    : undefined
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
  const exchangeRateInfoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const feeInfoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const slippageInfoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const estimatedDurationBottomSheetRef = useRef<BottomSheetRefType>(null)

  const allowCrossChainSwaps = getFeatureGate(StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS)

  const { decimalSeparator } = getNumberFormatSettings()

  const { maxSlippagePercentage, enableAppFee } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  )
  const parsedSlippagePercentage = new BigNumber(maxSlippagePercentage).toFormat()

  const { swappableFromTokens, swappableToTokens, areSwapTokensShuffled } = useSwappableTokens()

  const priceImpactWarningThreshold = useSelector(priceImpactWarningThresholdSelector)

  const tokensById = useSelector((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )

  const initialFromTokenId = route.params?.fromTokenId
  const initialToTokenId = route.params?.toTokenId
  const initialToTokenNetworkId = route.params?.toTokenNetworkId
  const [state, localDispatch] = useReducer(
    swapStateReducer,
    getInitialState(initialFromTokenId, initialToTokenId)
  )
  const {
    fromTokenId,
    toTokenId,
    inputSwapAmount,
    selectingField,
    selectingNoUsdPriceToken,
    confirmingSwap,
    switchedToNetworkId,
    startedSwapId,
  } = state

  const filterChipsFrom = useFilterChips(Field.FROM)
  const filterChipsTo = useFilterChips(Field.TO, initialToTokenNetworkId)

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

  const { quote, refreshQuote, fetchSwapQuoteError, fetchingSwapQuote, clearQuote } = useSwapQuote({
    networkId: fromToken?.networkId || networkConfig.defaultNetworkId,
    slippagePercentage: maxSlippagePercentage,
    enableAppFee: enableAppFee,
  })

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
        !quote.swapAmount.eq(parsedSwapAmount[Field.FROM]))) ||
    fetchingSwapQuote

  const confirmSwapIsLoading = swapStatus === 'started'
  const confirmSwapFailed = swapStatus === 'error'

  useEffect(() => {
    AppAnalytics.track(SwapEvents.swap_screen_open)
  }, [])

  useEffect(() => {
    if (fetchSwapQuoteError) {
      if (!fetchSwapQuoteError.message.includes(NO_QUOTE_ERROR_MESSAGE)) {
        dispatch(showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED))
      }
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
      quote.swapAmount.eq(parsedSwapAmount[Field.FROM])

    const debouncedRefreshQuote = setTimeout(() => {
      if (fromToken && toToken && parsedSwapAmount[Field.FROM].gt(0) && !quoteKnown) {
        void refreshQuote(fromToken, toToken, parsedSwapAmount, Field.FROM)
      }
    }, FETCH_UPDATED_QUOTE_DEBOUNCE_TIME)

    return () => {
      clearTimeout(debouncedRefreshQuote)
    }
  }, [fromToken, toToken, parsedSwapAmount, quote])

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

    const userInput = {
      toTokenId: toToken.tokenId,
      fromTokenId: fromToken.tokenId,
      swapAmount: {
        [Field.FROM]: parsedSwapAmount[Field.FROM].toString(),
        [Field.TO]: parsedSwapAmount[Field.TO].toString(),
      },
      updatedField: Field.FROM,
    }

    const { estimatedPriceImpact, price, allowanceTarget, appFeePercentageIncludedInPrice } = quote

    const resultType = quote.preparedTransactions.type
    switch (resultType) {
      case 'need-decrease-spend-amount-for-gas': // fallthrough on purpose
      case 'not-enough-balance-for-gas':
        // This should never actually happen, since the user should not be able
        // to confirm the swap in this case.
        break
      case 'possible':
        AppAnalytics.track(SwapEvents.swap_review_submit, {
          toToken: toToken.address,
          toTokenId: toToken.tokenId,
          toTokenNetworkId: toToken.networkId,
          toTokenIsImported: !!toToken.isManuallyImported,
          fromToken: fromToken.address,
          fromTokenId: fromToken.tokenId,
          fromTokenNetworkId: fromToken.networkId,
          fromTokenIsImported: !!fromToken.isManuallyImported,
          amount: inputSwapAmount[Field.FROM],
          amountType: 'sellAmount',
          allowanceTarget,
          estimatedPriceImpact,
          price,
          appFeePercentageIncludedInPrice,
          provider: quote.provider,
          swapType: quote.swapType,
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
              appFeePercentageIncludedInPrice,
              provider: quote.provider,
              estimatedPriceImpact,
              allowanceTarget,
              swapType: quote.swapType,
            },
            userInput,
            areSwapTokensShuffled,
          })
        )
        break
      default:
        // To catch any missing cases at compile time
        const assertNever: never = resultType
        return assertNever
    }
  }

  const handleSwitchTokens = () => {
    AppAnalytics.track(SwapEvents.swap_switch_tokens, { fromTokenId, toTokenId })
    localDispatch(
      selectTokens({
        fromTokenId: toTokenId,
        toTokenId: fromTokenId,
        switchedToNetworkId: null,
      })
    )
  }

  const handleShowTokenSelect = (fieldType: Field) => () => {
    AppAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType })
    localDispatch(startSelectToken({ fieldType }))

    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingField value is updated, so that the title of the
    // bottom sheet (which depends on selectingField) does not change on the
    // screen
    requestAnimationFrame(() => {
      tokenBottomSheetRefs[fieldType].current?.snapToIndex(0)
    })
  }

  const handleConfirmSelectToken = (selectedToken: TokenBalance, tokenPositionInList: number) => {
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
        toToken && toToken.networkId !== newFromToken.networkId && !allowCrossChainSwaps
          ? newFromToken.networkId
          : null
      if (newSwitchedToNetworkId) {
        // reset the toToken if the user is switching networks
        newToToken = undefined
      }
    } else if (selectingField === Field.TO) {
      newToToken = selectedToken
      newSwitchedToNetworkId =
        fromToken && fromToken.networkId !== newToToken.networkId && !allowCrossChainSwaps
          ? newToToken.networkId
          : null
      if (newSwitchedToNetworkId) {
        // reset the fromToken if the user is switching networks
        newFromToken = undefined
      }
    }

    AppAnalytics.track(SwapEvents.swap_screen_confirm_token, {
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
      tokenPositionInList,
    })

    localDispatch(
      selectTokens({
        fromTokenId: newFromToken?.tokenId,
        toTokenId: newToToken?.tokenId,
        switchedToNetworkId: allowCrossChainSwaps ? null : newSwitchedToNetworkId,
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
      handleConfirmSelectToken(
        selectingNoUsdPriceToken,
        selectingNoUsdPriceToken.tokenPositionInList
      )
    }
  }

  const handleDismissSelectTokenNoUsdPrice = () => {
    localDispatch(unselectNoUsdPriceToken())
  }

  const handleSelectToken = (selectedToken: TokenBalance, tokenPositionInList: number) => {
    if (!selectedToken.priceUsd && selectingField === Field.TO) {
      localDispatch(selectNoUsdPriceToken({ token: { ...selectedToken, tokenPositionInList } }))
      return
    }

    handleConfirmSelectToken(selectedToken, tokenPositionInList)
  }

  const handleChangeAmount = (value: string) => {
    localDispatch(changeAmount({ value }))
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
    AppAnalytics.track(SwapEvents.swap_screen_max_swap_amount, {
      tokenSymbol: fromToken.symbol,
      tokenId: fromToken.tokenId,
      tokenNetworkId: fromToken.networkId,
    })
  }

  const onPressLearnMore = () => {
    AppAnalytics.track(SwapEvents.swap_learn_more)
    navigate(Screens.WebViewScreen, { uri: SWAP_LEARN_MORE })
  }

  const onPressLearnMoreFees = () => {
    AppAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    navigate(Screens.WebViewScreen, { uri: TRANSACTION_FEES_LEARN_MORE })
  }

  const switchedToNetworkName = switchedToNetworkId && NETWORK_NAMES[switchedToNetworkId]

  const showCrossChainSwapNotification =
    toToken && fromToken && toToken.networkId !== fromToken.networkId && allowCrossChainSwaps

  const crossChainFeeCurrency = useSelector((state) =>
    feeCurrenciesSelector(state, fromToken?.networkId || networkConfig.defaultNetworkId)
  ).find((token) => token.isNative)
  const crossChainFee = getCrossChainFee(quote, crossChainFeeCurrency)

  const getWarningStatuses = () => {
    // NOTE: If a new condition is added here, make sure to update `allowSwap` below if
    // the condition should prevent the user from swapping.
    const checks = {
      showSwitchedToNetworkWarning: !!switchedToNetworkId,
      showUnsupportedTokensWarning:
        !quoteUpdatePending && fetchSwapQuoteError?.message.includes(NO_QUOTE_ERROR_MESSAGE),
      showInsufficientBalanceWarning: parsedSwapAmount[Field.FROM].gt(fromTokenBalance),
      showCrossChainFeeWarning:
        !quoteUpdatePending && crossChainFee?.nativeTokenBalanceDeficit.lt(0),
      showDecreaseSpendForGasWarning:
        !quoteUpdatePending &&
        quote?.preparedTransactions.type === 'need-decrease-spend-amount-for-gas',
      showNotEnoughBalanceForGasWarning:
        !quoteUpdatePending && quote?.preparedTransactions.type === 'not-enough-balance-for-gas',
      showMaxSwapAmountWarning: shouldShowMaxSwapAmountWarning && !confirmSwapFailed,
      showNoUsdPriceWarning:
        !confirmSwapFailed && !quoteUpdatePending && toToken && !toToken.priceUsd,
      showPriceImpactWarning:
        !confirmSwapFailed &&
        !quoteUpdatePending &&
        (quote?.estimatedPriceImpact
          ? new BigNumber(quote.estimatedPriceImpact).gte(priceImpactWarningThreshold)
          : false),
      showMissingPriceImpactWarning: !quoteUpdatePending && quote && !quote.estimatedPriceImpact,
    }

    // Only ever show a single warning, according to precedence as above.
    // Warnings that prevent the user from confirming the swap should
    // take higher priority over others.
    return Object.entries(checks).reduce(
      (acc, [name, status]) => {
        acc[name] = Object.values(acc).some(Boolean) ? false : !!status
        return acc
      },
      {} as Record<string, boolean>
    )
  }

  const {
    showCrossChainFeeWarning,
    showDecreaseSpendForGasWarning,
    showNotEnoughBalanceForGasWarning,
    showInsufficientBalanceWarning,
    showSwitchedToNetworkWarning,
    showMaxSwapAmountWarning,
    showNoUsdPriceWarning,
    showPriceImpactWarning,
    showUnsupportedTokensWarning,
    showMissingPriceImpactWarning,
  } = getWarningStatuses()

  const allowSwap = useMemo(
    () =>
      !showDecreaseSpendForGasWarning &&
      !showNotEnoughBalanceForGasWarning &&
      !showInsufficientBalanceWarning &&
      !showCrossChainFeeWarning &&
      !confirmSwapIsLoading &&
      !quoteUpdatePending &&
      Object.values(parsedSwapAmount).every((amount) => amount.gt(0)),
    [
      parsedSwapAmount,
      quoteUpdatePending,
      confirmSwapIsLoading,
      showInsufficientBalanceWarning,
      showDecreaseSpendForGasWarning,
      showNotEnoughBalanceForGasWarning,
      showCrossChainFeeWarning,
    ]
  )
  const networkFee: SwapFeeAmount | undefined = useMemo(() => {
    return getNetworkFee(quote)
  }, [fromToken, quote])

  const feeToken = networkFee?.token ? tokensById[networkFee.token.tokenId] : undefined

  const appFee: AppFeeAmount | undefined = useMemo(() => {
    if (!quote || !fromToken) {
      return undefined
    }

    const percentage = new BigNumber(quote.appFeePercentageIncludedInPrice || 0)

    return {
      amount: parsedSwapAmount[Field.FROM].multipliedBy(percentage).dividedBy(100),
      token: fromToken,
      percentage,
    }
  }, [quote, parsedSwapAmount, fromToken])

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

      AppAnalytics.track(SwapEvents.swap_price_impact_warning_displayed, {
        toToken: toToken.address,
        toTokenId: toToken.tokenId,
        toTokenNetworkId: toToken.networkId,
        toTokenIsImported: !!toToken.isManuallyImported,
        fromToken: fromToken.address,
        fromTokenId: fromToken.tokenId,
        fromTokenNetworkId: fromToken?.networkId,
        fromTokenIsImported: !!fromToken.isManuallyImported,
        amount: parsedSwapAmount[Field.FROM].toString(),
        amountType: 'sellAmount',
        priceImpact: quote.estimatedPriceImpact,
        provider: quote.provider,
      })
    }
  }, [showPriceImpactWarning || showMissingPriceImpactWarning])

  const feeCurrencies =
    quote && quote.preparedTransactions.type === 'not-enough-balance-for-gas'
      ? quote.preparedTransactions.feeCurrencies.map((feeCurrency) => feeCurrency.symbol).join(', ')
      : ''

  const tokenBottomSheetsConfig = [
    {
      fieldType: Field.FROM,
      tokens: swappableFromTokens,
      filterChips: filterChipsFrom,
      origin: TokenPickerOrigin.SwapFrom,
    },
    {
      fieldType: Field.TO,
      tokens: swappableToTokens,
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
            onInputChange={handleChangeAmount}
            inputValue={inputSwapAmount[Field.FROM]}
            parsedInputValue={parsedSwapAmount[Field.FROM]}
            onSelectToken={handleShowTokenSelect(Field.FROM)}
            token={fromToken}
            style={styles.fromSwapAmountInput}
            loading={false}
            autoFocus
            inputError={fromSwapAmountError}
            onPressMax={handleSetMaxFromAmount}
            buttonPlaceholder={t('swapScreen.selectTokenLabel')}
            borderRadius={Spacing.Regular16}
          />
          <View style={styles.switchTokensContainer}>
            <Touchable
              borderless
              borderRadius={Spacing.Regular16}
              shouldRenderRippleAbove
              style={styles.switchTokens}
              onPress={handleSwitchTokens}
              testID="SwapScreen/SwitchTokens"
            >
              <CircledIcon radius={Spacing.Large32} backgroundColor={colors.black}>
                <ArrowDown color={colors.white} />
              </CircledIcon>
            </Touchable>
          </View>
          <SwapAmountInput
            parsedInputValue={parsedSwapAmount[Field.TO]}
            inputValue={inputSwapAmount[Field.TO]}
            onSelectToken={handleShowTokenSelect(Field.TO)}
            token={toToken}
            style={styles.toSwapAmountInput}
            loading={quoteUpdatePending}
            buttonPlaceholder={t('swapScreen.selectTokenLabel')}
            editable={false}
            borderRadius={Spacing.Regular16}
          />

          {showCrossChainSwapNotification && (
            <View style={styles.crossChainNotificationWrapper}>
              <CrossChainIndicator />
              <Text style={styles.crossChainNotification}>
                {t('swapScreen.crossChainNotification')}
              </Text>
            </View>
          )}
          <SwapTransactionDetails
            feeInfoBottomSheetRef={feeInfoBottomSheetRef}
            slippageInfoBottomSheetRef={slippageInfoBottomSheetRef}
            estimatedDurationBottomSheetRef={estimatedDurationBottomSheetRef}
            slippagePercentage={parsedSlippagePercentage}
            fromToken={fromToken}
            toToken={toToken}
            exchangeRatePrice={quote?.price}
            exchangeRateInfoBottomSheetRef={exchangeRateInfoBottomSheetRef}
            swapAmount={parsedSwapAmount[Field.FROM]}
            fetchingSwapQuote={quoteUpdatePending}
            appFee={appFee}
            estimatedDurationInSeconds={
              quote?.swapType === 'cross-chain' ? quote.estimatedDurationInSeconds : undefined
            }
            crossChainFee={crossChainFee}
            networkFee={networkFee}
          />
          {showCrossChainFeeWarning && (
            <InLineNotification
              variant={NotificationVariant.Warning}
              title={t('swapScreen.crossChainFeeWarning.title', {
                tokenSymbol: crossChainFeeCurrency?.symbol,
              })}
              description={t('swapScreen.crossChainFeeWarning.body', {
                networkName:
                  NETWORK_NAMES[crossChainFeeCurrency?.networkId || networkConfig.defaultNetworkId],
                tokenSymbol: crossChainFeeCurrency?.symbol,
                tokenAmount: crossChainFee?.nativeTokenBalanceDeficit.abs().toFormat(),
              })}
              style={styles.warning}
            />
          )}
          {showDecreaseSpendForGasWarning && (
            <InLineNotification
              variant={NotificationVariant.Warning}
              title={t('swapScreen.decreaseSwapAmountForGasWarning.title', {
                feeTokenSymbol: feeToken?.symbol,
              })}
              description={t('swapScreen.decreaseSwapAmountForGasWarning.body', {
                feeTokenSymbol: feeToken?.symbol,
              })}
              onPressCta={() => {
                if (
                  !quote ||
                  quote.preparedTransactions.type !== 'need-decrease-spend-amount-for-gas'
                )
                  return
                handleChangeAmount(quote.preparedTransactions.decreasedSpendAmount.toString())
              }}
              ctaLabel={t('swapScreen.decreaseSwapAmountForGasWarning.cta')}
              style={styles.warning}
            />
          )}
          {showNotEnoughBalanceForGasWarning && (
            <InLineNotification
              variant={NotificationVariant.Warning}
              title={t('swapScreen.notEnoughBalanceForGas.title')}
              description={t('swapScreen.notEnoughBalanceForGas.description', {
                feeCurrencies,
              })}
              style={styles.warning}
              onPressCta={onPressLearnMoreFees}
            />
          )}
          {showInsufficientBalanceWarning && (
            <InLineNotification
              variant={NotificationVariant.Warning}
              title={t('swapScreen.insufficientBalanceWarning.title', {
                tokenSymbol: fromToken?.symbol,
              })}
              description={t('swapScreen.insufficientBalanceWarning.body', {
                tokenSymbol: fromToken?.symbol,
              })}
              style={styles.warning}
            />
          )}
          {showUnsupportedTokensWarning && (
            <InLineNotification
              variant={NotificationVariant.Info}
              title={t('swapScreen.unsupportedTokensWarning.title')}
              description={t('swapScreen.unsupportedTokensWarning.body')}
              style={styles.warning}
            />
          )}
          {showSwitchedToNetworkWarning && (
            <InLineNotification
              variant={NotificationVariant.Info}
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
              variant={NotificationVariant.Warning}
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
              variant={NotificationVariant.Warning}
              title={t('swapScreen.priceImpactWarning.title')}
              description={t('swapScreen.priceImpactWarning.body')}
              style={styles.warning}
            />
          )}
          {showNoUsdPriceWarning && (
            <InLineNotification
              variant={NotificationVariant.Warning}
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
              variant={NotificationVariant.Warning}
              title={t('swapScreen.missingSwapImpactWarning.title')}
              description={t('swapScreen.missingSwapImpactWarning.body')}
              style={styles.warning}
            />
          )}
          {confirmSwapFailed && (
            <InLineNotification
              variant={NotificationVariant.Warning}
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
      {tokenBottomSheetsConfig.map(({ fieldType, tokens, filterChips, origin }) => (
        <TokenBottomSheet
          key={`TokenBottomSheet/${fieldType}`}
          forwardedRef={tokenBottomSheetRefs[fieldType]}
          tokens={tokens}
          title={t('swapScreen.tokenBottomSheetTitle')}
          filterChips={filterChips}
          origin={origin}
          snapPoints={['90%']}
          onTokenSelected={handleSelectToken}
          searchEnabled={true}
          showPriceUsdUnavailableWarning={true}
          areSwapTokensShuffled={areSwapTokensShuffled}
        />
      ))}
      <BottomSheet
        forwardedRef={exchangeRateInfoBottomSheetRef}
        title={t('swapScreen.transactionDetails.exchangeRate')}
        description={t('swapScreen.transactionDetails.exchangeRateInfoV1_90', {
          context: appFee?.percentage?.isGreaterThan(0) ? 'withAppFee' : '',
          networkName: NETWORK_NAMES[fromToken?.networkId || networkConfig.defaultNetworkId],
          slippagePercentage: parsedSlippagePercentage,
          appFeePercentage: appFee?.percentage?.toFormat(),
        })}
        testId="ExchangeRateInfoBottomSheet"
      >
        <Button
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.bottomSheetButton}
          onPress={() => {
            exchangeRateInfoBottomSheetRef.current?.close()
          }}
          text={t('swapScreen.transactionDetails.infoDismissButton')}
        />
      </BottomSheet>
      <BottomSheet
        forwardedRef={estimatedDurationBottomSheetRef}
        title={t('swapScreen.transactionDetails.estimatedTransactionTime')}
        description={t('swapScreen.transactionDetails.estimatedTransactionTimeInfo')}
        testId="EstimatedDurationBottomSheet"
      >
        <Button
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.bottomSheetButton}
          onPress={() => {
            estimatedDurationBottomSheetRef.current?.close()
          }}
          text={t('swapScreen.transactionDetails.infoDismissButton')}
        />
      </BottomSheet>
      <BottomSheet
        forwardedRef={slippageInfoBottomSheetRef}
        title={t('swapScreen.transactionDetails.slippagePercentage')}
        description={t('swapScreen.transactionDetails.slippageToleranceInfoV1_90')}
        testId="SlippageInfoBottomSheet"
      >
        <Button
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.bottomSheetButton}
          onPress={() => {
            slippageInfoBottomSheetRef.current?.close()
          }}
          text={t('swapScreen.transactionDetails.infoDismissButton')}
        />
      </BottomSheet>
      <FeeInfoBottomSheet
        forwardedRef={feeInfoBottomSheetRef}
        crossChainFee={crossChainFee}
        networkFee={networkFee}
        appFee={appFee}
        fetchingSwapQuote={fetchingSwapQuote}
      />
      <Toast
        withBackdrop
        showToast={!!selectingNoUsdPriceToken}
        variant={NotificationVariant.Warning}
        title={t('swapScreen.noUsdPriceWarning.title', { localCurrency })}
        description={t('swapScreen.noUsdPriceWarning.description', {
          localCurrency,
          tokenSymbol: selectingNoUsdPriceToken?.symbol,
        })}
        ctaLabel2={t('swapScreen.noUsdPriceWarning.ctaConfirm')}
        onPressCta2={handleConfirmSelectTokenNoUsdPrice}
        ctaLabel={t('swapScreen.noUsdPriceWarning.ctaDismiss')}
        onPressCta={handleDismissSelectTokenNoUsdPrice}
        onDismiss={handleDismissSelectTokenNoUsdPrice}
      />
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
    marginBottom: Spacing.Smallest8,
  },
  toSwapAmountInput: {
    marginBottom: Spacing.Small12,
  },
  disclaimerText: {
    ...typeScale.labelXXSmall,
    paddingBottom: Spacing.Smallest8,
    flexWrap: 'wrap',
    color: colors.gray3,
    textAlign: 'center',
  },
  disclaimerLink: {
    ...typeScale.labelXXSmall,
    color: colors.black,
  },
  warning: {
    marginTop: Spacing.Thick24,
  },
  bottomSheetButton: {
    marginTop: Spacing.Thick24,
  },
  switchTokens: {
    position: 'absolute',
    top: -20,
    left: -Spacing.Regular16,
    zIndex: 1,
  },
  switchTokensContainer: {
    zIndex: 1,
    alignItems: 'center',
  },
  crossChainNotificationWrapper: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.Thick24,
  },
  crossChainNotification: {
    ...typeScale.labelXSmall,
    paddingLeft: Spacing.Tiny4,
    color: colors.gray4,
  },
})

export default SwapScreen
