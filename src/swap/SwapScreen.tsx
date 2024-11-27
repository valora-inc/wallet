import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SwapEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import TokenBottomSheet, {
  TokenBottomSheetProps,
  TokenPickerOrigin,
} from 'src/components/TokenBottomSheet'
import TokenEnterAmount, {
  FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS,
  useEnterAmount,
} from 'src/components/TokenEnterAmount'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
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
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import getCrossChainFee from 'src/swap/getCrossChainFee'
import { getSwapTxsAnalyticsProperties } from 'src/swap/getSwapTxsAnalyticsProperties'
import { currentSwapSelector, priceImpactWarningThresholdSelector } from 'src/swap/selectors'
import { swapStart } from 'src/swap/slice'
import { AppFeeAmount, Field, SwapFeeAmount } from 'src/swap/types'
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
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import networkConfig from 'src/web3/networkConfig'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'SwapScreen'
type ToToken = TokenBalance & { tokenPositionInList?: number }

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
  const allowCrossChainSwaps = getFeatureGate(StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS)
  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)
  const { swappableFromTokens, swappableToTokens, areSwapTokensShuffled } = useSwappableTokens()
  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])
  const { maxSlippagePercentage, enableAppFee } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  )
  const parsedSlippagePercentage = new BigNumber(maxSlippagePercentage).toFormat()
  const priceImpactWarningThreshold = useSelector(priceImpactWarningThresholdSelector)
  const tokensById = useSelector((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )

  const inputFromRef = useRef<RNTextInput>(null)
  const inputToRef = useRef<RNTextInput>(null)
  const tokenBottomSheetFromRef = useRef<BottomSheetModalRefType>(null)
  const tokenBottomSheetToRef = useRef<BottomSheetModalRefType>(null)
  const exchangeRateInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const feeInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const slippageInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const estimatedDurationBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const [startedSwapId, setStartedSwapId] = useState<string | undefined>(undefined)
  const [confirmingSwap, setConfirmingSwap] = useState(false)
  const [switchedToNetworkId, setSwitchedToNetworkId] = useState<NetworkId | null>(null)

  const [fromToken, setFromToken] = useState(() => {
    if (!route.params?.fromTokenId) return undefined
    return swappableFromTokens.find((token) => token.tokenId === route.params!.fromTokenId)
  })

  const [toToken, setToToken] = useState<ToToken | undefined>(() => {
    if (!route.params?.toTokenId) return undefined
    const token = swappableToTokens.find((token) => token.tokenId === route.params!.toTokenId)
    if (!token) return undefined
    return { ...token, tokenPositionInList: undefined }
  })

  const {
    amount: amountFrom,
    amountType,
    processedAmounts: derivedFrom,
    handleAmountInputChange,
    handleToggleAmountType,
    onChangeAmount,
  } = useEnterAmount({
    inputRef: inputFromRef,
    token: fromToken!,
    onAmountChange: (amount) => {
      setConfirmingSwap(false)
      setStartedSwapId(undefined)
      if (!amount) {
        clearQuote()
      }
    },
  })

  const {
    amount: amountTo,
    processedAmounts: derivedTo,
    handleAmountInputChange: handleAmountInputChangeTo,
  } = useEnterAmount({
    token: toToken!,
    inputRef: inputToRef,
  })

  const initialToTokenNetworkId = route.params?.toTokenNetworkId
  const filterChipsFrom = useFilterChips(Field.FROM)
  const filterChipsTo = useFilterChips(Field.TO, initialToTokenNetworkId)

  const fromTokenBalance = useTokenInfo(fromToken?.tokenId)?.balance ?? new BigNumber(0)

  const currentSwap = useSelector(currentSwapSelector)
  const swapStatus = startedSwapId === currentSwap?.id ? currentSwap?.status : null

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

  const shouldShowMaxSwapAmountWarning =
    feeCurrenciesWithPositiveBalances.length === 1 &&
    fromToken?.tokenId === feeCurrenciesWithPositiveBalances[0].tokenId &&
    fromTokenBalance.gt(0) &&
    derivedFrom.token.bignum &&
    derivedFrom.token.bignum.gte(fromTokenBalance)

  const fromSwapAmountError =
    confirmingSwap && derivedFrom.token.bignum && derivedFrom.token.bignum.gt(fromTokenBalance)

  const quoteUpdatePending =
    (derivedFrom.token.bignum &&
      quote &&
      (quote.fromTokenId !== fromToken?.tokenId ||
        quote.toTokenId !== toToken?.tokenId ||
        !quote.swapAmount.eq(derivedFrom.token.bignum))) ||
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
      derivedFrom.token.bignum &&
      quote &&
      quote.toTokenId === toToken.tokenId &&
      quote.fromTokenId === fromToken.tokenId &&
      quote.swapAmount.eq(derivedFrom.token.bignum)

    const debouncedRefreshQuote = setTimeout(() => {
      if (
        fromToken &&
        toToken &&
        derivedFrom.token.bignum &&
        derivedFrom.token.bignum.gt(0) &&
        !quoteKnown
      ) {
        void refreshQuote(
          fromToken,
          toToken,
          { FROM: derivedFrom.token.bignum, TO: derivedTo.token.bignum! },
          Field.FROM
        )
      }
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS)

    return () => {
      clearTimeout(debouncedRefreshQuote)
    }
  }, [fromToken, toToken, derivedFrom.token.bignum, derivedTo.token.bignum, quote])

  useEffect(() => {
    setConfirmingSwap(false)

    if (!quote) {
      handleAmountInputChangeTo('')
      return
    }

    if (!derivedFrom.token.bignum) return
    const newAmount = derivedFrom.token.bignum.multipliedBy(new BigNumber(quote.price))
    handleAmountInputChangeTo(newAmount.toString())
  }, [quote])

  const onOpenTokenPickerFrom = () => {
    setConfirmingSwap(false)
    AppAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType: Field.FROM })
    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingField value is updated, so that the title of the
    // bottom sheet (which depends on selectingField) does not change on the
    // screen
    requestAnimationFrame(() => tokenBottomSheetFromRef.current?.snapToIndex(0))
  }

  const onOpenTokenPickerTo = () => {
    setConfirmingSwap(false)
    AppAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType: Field.TO })
    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingField value is updated, so that the title of the
    // bottom sheet (which depends on selectingField) does not change on the
    // screen
    requestAnimationFrame(() => tokenBottomSheetToRef.current?.snapToIndex(0))
  }

  const onSelectTokenFrom: TokenBottomSheetProps['onTokenSelected'] = (
    token,
    tokenPositionInList
  ) => {
    setConfirmingSwap(false)
    setFromToken(token)
    confirmSelectTokenFrom(token, tokenPositionInList)
  }

  const onSelectTokenTo: TokenBottomSheetProps['onTokenSelected'] = (
    token,
    tokenPositionInList
  ) => {
    setConfirmingSwap(false)
    setToToken({ ...token, tokenPositionInList })
    confirmSelectTokenTo(token, tokenPositionInList)
  }

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

    setConfirmingSwap(true)

    const userInput = {
      toTokenId: toToken.tokenId,
      fromTokenId: fromToken.tokenId,
      swapAmount: {
        [Field.FROM]: derivedFrom.token.bignum ? derivedFrom.token.bignum.toString() : '',
        [Field.TO]: derivedTo.token.bignum ? derivedTo.token.bignum.toString() : '',
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
          amount: derivedFrom.token.amount,
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
    AppAnalytics.track(SwapEvents.swap_switch_tokens, {
      fromTokenId: fromToken?.tokenId,
      toTokenId: toToken?.tokenId,
    })
    setFromToken(toToken)
    setToToken(fromToken)
  }

  const handleConfirmSelectTokenNoUsdPrice = () => {
    if (toToken?.tokenPositionInList !== undefined) {
      confirmSelectTokenTo(toToken, toToken.tokenPositionInList)
    }
  }

  const handleDismissSelectTokenNoUsdPrice = () => {
    setToToken((prev) => (prev ? { ...prev, tokenPositionInList: undefined } : undefined))
  }

  // const handleSetMaxFromAmount = () => {
  //   localDispatch(chooseMaxFromAmount({ fromTokenBalance }))
  //   setStartedSwapId(undefined)
  //   if (!fromToken) {
  //     // Should never happen
  //     return
  //   }
  //   AppAnalytics.track(SwapEvents.swap_screen_max_swap_amount, {
  //     tokenSymbol: fromToken.symbol,
  //     tokenId: fromToken.tokenId,
  //     tokenNetworkId: fromToken.networkId,
  //   })
  // }

  const trackConfirmToken = ({
    selectedToken,
    field,
    newFromToken,
    newToToken,
    newSwitchedToNetworkId,
    tokenPositionInList,
  }: {
    selectedToken: TokenBalance
    field: Field
    newFromToken: TokenBalance | undefined
    newToToken: TokenBalance | undefined
    newSwitchedToNetworkId: NetworkId | null
    tokenPositionInList: number
  }) => {
    AppAnalytics.track(SwapEvents.swap_screen_confirm_token, {
      fieldType: field,
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
  }

  const confirmSelectTokenFrom = (selectedToken: TokenBalance, tokenPositionInList: number) => {
    // if in "from" we select the same token as in "to" then just swap
    if (toToken?.tokenId === selectedToken.tokenId) {
      setFromToken(toToken)
      setToToken(fromToken)

      trackConfirmToken({
        field: Field.FROM,
        selectedToken,
        newFromToken: toToken,
        newToToken: fromToken,
        newSwitchedToNetworkId: null,
        tokenPositionInList,
      })

      setStartedSwapId(undefined)
      setConfirmingSwap(false)
      setSwitchedToNetworkId(null)

      /**
       * use requestAnimationFrame so that the bottom sheet and keyboard dismiss
       * animation can be synchronised and starts after the state changes above.
       * without this, the keyboard animation lags behind the state updates while
       * the bottom sheet does not
       */
      requestAnimationFrame(() => tokenBottomSheetFromRef.current?.close())

      return
    }

    // Otherwise, proceed with the regular flow

    setFromToken(selectedToken)

    const newSwitchedToNetworkId =
      toToken && toToken.networkId !== selectedToken.networkId && !allowCrossChainSwaps
        ? selectedToken.networkId
        : null

    trackConfirmToken({
      field: Field.FROM,
      selectedToken,
      newFromToken: selectedToken,
      newToToken: newSwitchedToNetworkId ? undefined : toToken,
      newSwitchedToNetworkId,
      tokenPositionInList,
    })

    if (selectedToken?.tokenId !== fromToken?.tokenId) {
      setStartedSwapId(undefined)
    }

    setConfirmingSwap(false)

    if (newSwitchedToNetworkId) {
      // reset the toToken if the user is switching networks
      setToToken(undefined)
      setSwitchedToNetworkId(allowCrossChainSwaps ? null : newSwitchedToNetworkId)
      clearQuote()
    }

    /**
     * use requestAnimationFrame so that the bottom sheet and keyboard dismiss
     * animation can be synchronised and starts after the state changes above.
     * without this, the keyboard animation lags behind the state updates while
     * the bottom sheet does not
     */
    requestAnimationFrame(() => tokenBottomSheetFromRef.current?.close())
  }

  const confirmSelectTokenTo = (selectedToken: TokenBalance, tokenPositionInList: number) => {
    if (fromToken?.tokenId === selectedToken.tokenId) {
      setFromToken(toToken)
      setToToken(fromToken)

      trackConfirmToken({
        field: Field.TO,
        selectedToken,
        newFromToken: toToken,
        newToToken: fromToken,
        newSwitchedToNetworkId: null,
        tokenPositionInList,
      })

      setStartedSwapId(undefined)
      setConfirmingSwap(false)
      setSwitchedToNetworkId(null)

      /**
       * use requestAnimationFrame so that the bottom sheet and keyboard dismiss
       * animation can be synchronised and starts after the state changes above.
       * without this, the keyboard animation lags behind the state updates while
       * the bottom sheet does not
       */
      requestAnimationFrame(() => tokenBottomSheetToRef.current?.close())

      return
    } else {
      setToToken(selectedToken)
      const newSwitchedToNetworkId =
        fromToken && fromToken.networkId !== selectedToken.networkId && !allowCrossChainSwaps
          ? selectedToken.networkId
          : null

      trackConfirmToken({
        field: Field.TO,
        selectedToken,
        newFromToken: newSwitchedToNetworkId ? undefined : fromToken,
        newToToken: selectedToken,
        newSwitchedToNetworkId,
        tokenPositionInList,
      })

      if (selectedToken?.tokenId !== toToken?.tokenId) {
        setStartedSwapId(undefined)
      }

      setConfirmingSwap(false)

      if (newSwitchedToNetworkId) {
        // reset the fromToken if the user is switching networks
        setFromToken(undefined)
        setSwitchedToNetworkId(allowCrossChainSwaps ? null : newSwitchedToNetworkId)
        clearQuote()
      }

      /**
       * use requestAnimationFrame so that the bottom sheet and keyboard dismiss
       * animation can be synchronised and starts after the state changes above.
       * without this, the keyboard animation lags behind the state updates while
       * the bottom sheet does not
       */
      requestAnimationFrame(() => tokenBottomSheetToRef.current?.close())
    }
  }

  const onPressLearnMore = () => {
    AppAnalytics.track(SwapEvents.swap_learn_more)
    navigate(Screens.WebViewScreen, { uri: links.swapLearnMore })
  }

  const onPressLearnMoreFees = () => {
    AppAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    navigate(Screens.WebViewScreen, { uri: links.transactionFeesLearnMore })
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
      showInsufficientBalanceWarning:
        derivedFrom.token.bignum && derivedFrom.token.bignum.gt(fromTokenBalance),
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
      derivedFrom.token.bignum?.gt(0) &&
      derivedTo.token.bignum?.gt(0),
    [
      derivedFrom.token.bignum,
      derivedTo.token.bignum,
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
    if (!quote || !fromToken || !derivedFrom.token.bignum) {
      return undefined
    }

    const percentage = new BigNumber(quote.appFeePercentageIncludedInPrice || 0)

    return {
      amount: derivedFrom.token.bignum.multipliedBy(percentage).dividedBy(100),
      token: fromToken,
      percentage,
    }
  }, [quote, derivedFrom.token.bignum, fromToken])

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
        amount: derivedFrom.token.bignum ? derivedFrom.token.bignum.toString() : '',
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
        <View style={[styles.swapAmountsContainer, { gap: 4 }]}>
          <TokenEnterAmount
            autoFocus
            token={fromToken}
            inputValue={amountFrom}
            inputRef={inputFromRef}
            tokenAmount={derivedFrom.token.displayAmount}
            localAmount={derivedFrom.local.displayAmount}
            onInputChange={handleAmountInputChange}
            amountType={amountType}
            toggleAmountType={handleToggleAmountType}
            onOpenTokenPicker={onOpenTokenPickerFrom}
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
          <TokenEnterAmount
            editable={false}
            token={toToken}
            inputValue={amountTo}
            inputRef={inputToRef}
            tokenAmount={derivedTo.token.displayAmount}
            localAmount={derivedTo.local.displayAmount}
            amountType={amountType}
            onOpenTokenPicker={onOpenTokenPickerTo}
          />
        </View>

        <View style={styles.swapAmountsContainer}>
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
            swapAmount={derivedFrom.token.bignum ?? undefined}
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
                onChangeAmount(quote.preparedTransactions.decreasedSpendAmount.toString())
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
                // TODO
                // context: selectingField === Field.FROM ? 'swapTo' : 'swapFrom',
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
          <Trans
            i18nKey="swapScreen.disclaimer"
            context={showUKCompliantVariant ? 'UK' : undefined}
          >
            <Text style={styles.disclaimerLink} onPress={onPressLearnMore}></Text>
          </Trans>
        </Text>
        <Button
          testID="ConfirmSwapButton"
          onPress={handleConfirmSwap}
          text={t('swapScreen.confirmSwap', { context: showUKCompliantVariant ? 'UK' : undefined })}
          size={BtnSizes.FULL}
          disabled={!allowSwap}
          showLoading={confirmSwapIsLoading}
        />
      </ScrollView>

      <TokenBottomSheet
        searchEnabled
        showPriceUsdUnavailableWarning
        key={`TokenBottomSheet/From`}
        snapPoints={['90%']}
        title={t('swapScreen.tokenBottomSheetTitle')}
        origin={TokenPickerOrigin.SwapFrom}
        forwardedRef={tokenBottomSheetFromRef}
        tokens={swappableFromTokens}
        filterChips={filterChipsFrom}
        onTokenSelected={onSelectTokenFrom}
        areSwapTokensShuffled={areSwapTokensShuffled}
      />
      <TokenBottomSheet
        searchEnabled
        showPriceUsdUnavailableWarning
        key={`TokenBottomSheet/To`}
        snapPoints={['90%']}
        title={t('swapScreen.tokenBottomSheetTitle')}
        origin={TokenPickerOrigin.SwapTo}
        forwardedRef={tokenBottomSheetToRef}
        tokens={swappableToTokens}
        filterChips={filterChipsTo}
        onTokenSelected={onSelectTokenTo}
        areSwapTokensShuffled={areSwapTokensShuffled}
      />
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
        showToast={!!toToken?.tokenPositionInList !== undefined}
        variant={NotificationVariant.Warning}
        title={t('swapScreen.noUsdPriceWarning.title', { localCurrency })}
        description={t('swapScreen.noUsdPriceWarning.description', {
          localCurrency,
          tokenSymbol: toToken?.symbol,
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
