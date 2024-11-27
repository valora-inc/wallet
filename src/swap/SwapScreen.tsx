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
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
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
import { useSwappableTokens } from 'src/tokens/hooks'
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

function getNetworkFee(quote: QuoteResult | null): SwapFeeAmount | undefined {
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

  const currentSwap = useSelector(currentSwapSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const priceImpactWarningThreshold = useSelector(priceImpactWarningThresholdSelector)
  const tokensById = useSelector((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )
  const crossChainFeeCurrency = useSelector((state) =>
    feeCurrenciesSelector(state, fromToken?.networkId || networkConfig.defaultNetworkId)
  ).find((token) => token.isNative)
  const feeCurrenciesWithPositiveBalances = useSelector((state) =>
    feeCurrenciesWithPositiveBalancesSelector(
      state,
      fromToken?.networkId || networkConfig.defaultNetworkId
    )
  )

  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const inputFromRef = useRef<RNTextInput>(null)
  const inputToRef = useRef<RNTextInput>(null)
  const tokenBottomSheetFromRef = useRef<BottomSheetModalRefType>(null)
  const tokenBottomSheetToRef = useRef<BottomSheetModalRefType>(null)
  const exchangeRateInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const feeInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const slippageInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const estimatedDurationBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const [startedSwapId, setStartedSwapId] = useState<string | undefined>(undefined)
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

  const { quote, refreshQuote, fetchSwapQuoteError, fetchingSwapQuote, clearQuote } = useSwapQuote({
    networkId: fromToken?.networkId || networkConfig.defaultNetworkId,
    slippagePercentage: maxSlippagePercentage,
    enableAppFee: enableAppFee,
    onError: (error) => {
      if (!error.message.includes(NO_QUOTE_ERROR_MESSAGE)) {
        dispatch(showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED))
      }
    },
    onSuccess: (newQuote) => {
      if (!newQuote) {
        replaceAmountTo('')
        return
      }

      if (!derivedFrom.token.bignum) return
      const newAmount = derivedFrom.token.bignum
        .multipliedBy(new BigNumber(newQuote.price))
        .toString()
      replaceAmountTo(newAmount)
    },
  })

  useEffect(() => {
    console.log({ fetchingSwapQuote })
  }, [fetchingSwapQuote])
  const {
    amount: amountFrom,
    amountType,
    processedAmounts: derivedFrom,
    handleAmountInputChange,
    handleToggleAmountType,
    onChangeAmount,
  } = useEnterAmount({
    inputRef: inputFromRef,
    token: fromToken,
    onAmountChange: (amount) => {
      console.log('onAmountChange', amount)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      setStartedSwapId(undefined)
      if (!amount) {
        clearQuote()
        replaceAmountTo('')
        return
      }

      debounceTimerRef.current = setTimeout(() => {
        const parsedAmount = new BigNumber(amount)
        const bothTokensPresent = !!(fromToken && toToken)
        const amountIsTooSmall = !parsedAmount || parsedAmount.lte(0)

        if (!bothTokensPresent || amountIsTooSmall) {
          return
        }

        // This variable prevents the quote from needlessly being fetched again.
        const quoteIsTheSameAsTheLastOne =
          quote &&
          quote.toTokenId === toToken.tokenId &&
          quote.fromTokenId === fromToken.tokenId &&
          quote.swapAmount.eq(parsedAmount)

        if (!quoteIsTheSameAsTheLastOne) {
          console.log('Updating quote', parsedAmount)
          replaceAmountTo('')
          void refreshQuote(fromToken, toToken, { FROM: parsedAmount, TO: null }, Field.FROM)
        }
      }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS)
    },
  })

  const {
    amount: amountTo,
    processedAmounts: derivedTo,
    replaceAmount: replaceAmountTo,
  } = useEnterAmount({ token: toToken, inputRef: inputToRef })

  const filterChipsFrom = useFilterChips(Field.FROM)
  const filterChipsTo = useFilterChips(Field.TO, route.params?.toTokenNetworkId)
  const parsedSlippagePercentage = new BigNumber(maxSlippagePercentage).toFormat()
  const crossChainFee = getCrossChainFee(quote, crossChainFeeCurrency)
  const swapStatus = startedSwapId === currentSwap?.id ? currentSwap?.status : null
  const confirmSwapIsLoading = swapStatus === 'started'
  const confirmSwapFailed = swapStatus === 'error'
  const switchedToNetworkName = switchedToNetworkId && NETWORK_NAMES[switchedToNetworkId]
  const showCrossChainSwapNotification =
    toToken && fromToken && toToken.networkId !== fromToken.networkId && allowCrossChainSwaps
  const feeCurrencies =
    quote && quote.preparedTransactions.type === 'not-enough-balance-for-gas'
      ? quote.preparedTransactions.feeCurrencies.map((feeCurrency) => feeCurrency.symbol).join(', ')
      : ''

  const networkFee = useMemo(() => getNetworkFee(quote), [fromToken, quote])
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

  const shouldShowSkeletons = useMemo(() => {
    if (fetchingSwapQuote) return true

    if (
      quote &&
      (quote.fromTokenId !== fromToken?.tokenId || quote.toTokenId !== toToken?.tokenId)
    ) {
      return true
    }

    if (quote && derivedFrom.token.bignum && !quote.swapAmount.eq(derivedFrom.token.bignum)) {
      return true
    }

    return false
  }, [fetchingSwapQuote, quote, fromToken, toToken, derivedFrom])

  const warnings = useMemo(() => {
    const shouldShowMaxSwapAmountWarning =
      feeCurrenciesWithPositiveBalances.length === 1 &&
      fromToken?.tokenId === feeCurrenciesWithPositiveBalances[0].tokenId &&
      fromToken?.balance.gt(0) &&
      derivedFrom.token.bignum &&
      derivedFrom.token.bignum.gte(fromToken?.balance)

    // NOTE: If a new condition is added here, make sure to update `allowSwap` below if
    // the condition should prevent the user from swapping.
    const checks = {
      showSwitchedToNetworkWarning: !!switchedToNetworkId,
      showUnsupportedTokensWarning:
        !shouldShowSkeletons && fetchSwapQuoteError?.message.includes(NO_QUOTE_ERROR_MESSAGE),
      showInsufficientBalanceWarning:
        fromToken && derivedFrom.token.bignum && derivedFrom.token.bignum.gt(fromToken.balance),
      showCrossChainFeeWarning:
        !shouldShowSkeletons && crossChainFee?.nativeTokenBalanceDeficit.lt(0),
      showDecreaseSpendForGasWarning:
        !shouldShowSkeletons &&
        quote?.preparedTransactions.type === 'need-decrease-spend-amount-for-gas',
      showNotEnoughBalanceForGasWarning:
        !shouldShowSkeletons && quote?.preparedTransactions.type === 'not-enough-balance-for-gas',
      showMaxSwapAmountWarning: shouldShowMaxSwapAmountWarning && !confirmSwapFailed,
      showNoUsdPriceWarning:
        !confirmSwapFailed && !shouldShowSkeletons && toToken && !toToken.priceUsd,
      showPriceImpactWarning:
        !confirmSwapFailed &&
        !shouldShowSkeletons &&
        (quote?.estimatedPriceImpact
          ? new BigNumber(quote.estimatedPriceImpact).gte(priceImpactWarningThreshold)
          : false),
      showMissingPriceImpactWarning: !shouldShowSkeletons && quote && !quote.estimatedPriceImpact,
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
  }, [
    feeCurrenciesWithPositiveBalances,
    fromToken,
    toToken,
    derivedFrom,
    switchedToNetworkId,
    shouldShowSkeletons,
    fetchSwapQuoteError,
    crossChainFee,
    quote,
    confirmSwapFailed,
    priceImpactWarningThreshold,
  ])

  const allowSwap = useMemo(
    () =>
      !warnings.showDecreaseSpendForGasWarning &&
      !warnings.showNotEnoughBalanceForGasWarning &&
      !warnings.showInsufficientBalanceWarning &&
      !warnings.showCrossChainFeeWarning &&
      !confirmSwapIsLoading &&
      !shouldShowSkeletons &&
      derivedFrom.token.bignum?.gt(0) &&
      derivedTo.token.bignum?.gt(0),
    [
      derivedFrom.token.bignum,
      derivedTo.token.bignum,
      shouldShowSkeletons,
      confirmSwapIsLoading,
      warnings.showInsufficientBalanceWarning,
      warnings.showDecreaseSpendForGasWarning,
      warnings.showNotEnoughBalanceForGasWarning,
      warnings.showCrossChainFeeWarning,
    ]
  )

  useEffect(function trackSwapScreenOpen() {
    AppAnalytics.track(SwapEvents.swap_screen_open)
  }, [])

  useEffect(
    function trackImpactWarningDisplayed() {
      if (warnings.showPriceImpactWarning || warnings.showMissingPriceImpactWarning) {
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
    },
    [warnings.showPriceImpactWarning || warnings.showMissingPriceImpactWarning]
  )

  function onOpenTokenPickerFrom() {
    AppAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType: Field.FROM })
    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingField value is updated, so that the title of the
    // bottom sheet (which depends on selectingField) does not change on the
    // screen
    requestAnimationFrame(() => tokenBottomSheetFromRef.current?.snapToIndex(0))
  }

  function onOpenTokenPickerTo() {
    AppAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType: Field.TO })
    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingField value is updated, so that the title of the
    // bottom sheet (which depends on selectingField) does not change on the
    // screen
    requestAnimationFrame(() => tokenBottomSheetToRef.current?.snapToIndex(0))
  }

  function handleConfirmSwap() {
    if (!quote) {
      return // this should never happen, because the button must be disabled in that cases
    }

    const fromToken = tokensById[quote.fromTokenId]
    const toToken = tokensById[quote.toTokenId]

    if (!fromToken || !toToken) {
      // Should never happen
      return
    }

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

  function handleSwitchTokens() {
    AppAnalytics.track(SwapEvents.swap_switch_tokens, {
      fromTokenId: fromToken?.tokenId,
      toTokenId: toToken?.tokenId,
    })

    setFromToken(toToken)
    setToToken(fromToken)
    replaceAmountTo('')

    if (fromToken && toToken) {
      void refreshQuote(
        toToken,
        fromToken,
        { FROM: derivedFrom.token.bignum, TO: null },
        Field.FROM
      )
    }
  }

  function handleConfirmSelectTokenNoUsdPrice() {
    if (!!toToken && toToken.tokenPositionInList !== undefined) {
      onSelectTokenTo(toToken, toToken.tokenPositionInList)
    }
  }

  function handleDismissSelectTokenNoUsdPrice() {
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

  function trackConfirmToken({
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
  }) {
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

  function onSelectTokenFrom(selectedToken: TokenBalance, tokenPositionInList: number) {
    // if in "from" we select the same token as in "to" then just swap
    if (toToken?.tokenId === selectedToken.tokenId) {
      setFromToken(toToken)
      setToToken(fromToken)
      setStartedSwapId(undefined)
      setSwitchedToNetworkId(null)
      replaceAmountTo('')

      trackConfirmToken({
        field: Field.FROM,
        selectedToken,
        newFromToken: toToken,
        newToToken: fromToken,
        newSwitchedToNetworkId: null,
        tokenPositionInList,
      })

      if (toToken && fromToken) {
        void refreshQuote(
          toToken,
          fromToken,
          { FROM: derivedFrom.token.bignum, TO: null },
          Field.FROM
        )
      }

      /**
       * Use requestAnimationFrame so that the bottom sheet and keyboard dismiss
       * animation can be synchronised and starts after the state changes above.
       * Without this, the keyboard animation lags behind the state updates while
       * the bottom sheet does not.
       */
      requestAnimationFrame(() => tokenBottomSheetFromRef.current?.close())
      return
    }

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

    if (newSwitchedToNetworkId) {
      // reset the toToken if the user is switching networks
      setToToken(undefined)
      setSwitchedToNetworkId(allowCrossChainSwaps ? null : newSwitchedToNetworkId)
      clearQuote()
    }

    if (toToken) {
      void refreshQuote(
        selectedToken,
        toToken,
        { FROM: derivedFrom.token.bignum, TO: null },
        Field.FROM
      )
    }

    /**
     * Use requestAnimationFrame so that the bottom sheet and keyboard dismiss
     * animation can be synchronised and starts after the state changes above.
     * Without this, the keyboard animation lags behind the state updates while
     * the bottom sheet does not.
     */
    requestAnimationFrame(() => tokenBottomSheetFromRef.current?.close())
  }

  function onSelectTokenTo(selectedToken: TokenBalance, tokenPositionInList: number) {
    if (fromToken?.tokenId === selectedToken.tokenId) {
      setFromToken(toToken)
      setToToken(fromToken)
      setStartedSwapId(undefined)
      setSwitchedToNetworkId(null)
      replaceAmountTo('')

      trackConfirmToken({
        field: Field.TO,
        selectedToken,
        newFromToken: toToken,
        newToToken: fromToken,
        newSwitchedToNetworkId: null,
        tokenPositionInList,
      })

      if (toToken && fromToken) {
        void refreshQuote(
          toToken,
          fromToken,
          { FROM: derivedFrom.token.bignum, TO: null },
          Field.FROM
        )
      }

      /**
       * Use requestAnimationFrame so that the bottom sheet and keyboard dismiss
       * animation can be synchronised and starts after the state changes above.
       * Without this, the keyboard animation lags behind the state updates while
       * the bottom sheet does not.
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

      if (newSwitchedToNetworkId) {
        // reset the fromToken if the user is switching networks
        setFromToken(undefined)
        setSwitchedToNetworkId(allowCrossChainSwaps ? null : newSwitchedToNetworkId)
        clearQuote()
      }

      if (fromToken) {
        void refreshQuote(
          fromToken,
          selectedToken,
          { FROM: derivedFrom.token.bignum, TO: null },
          Field.FROM
        )
      }

      /**
       * Use requestAnimationFrame so that the bottom sheet and keyboard dismiss
       * animation can be synchronised and starts after the state changes above.
       * Without this, the keyboard animation lags behind the state updates while
       * the bottom sheet does not.
       */
      requestAnimationFrame(() => tokenBottomSheetToRef.current?.close())
    }
  }

  function onPressLearnMore() {
    AppAnalytics.track(SwapEvents.swap_learn_more)
    navigate(Screens.WebViewScreen, { uri: links.swapLearnMore })
  }

  function onPressLearnMoreFees() {
    AppAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    navigate(Screens.WebViewScreen, { uri: links.transactionFeesLearnMore })
  }

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
        <View style={{ display: 'flex', justifyContent: 'space-between', flexGrow: 1 }}>
          <View style={{ flexShrink: 0 }}>
            <View style={[styles.warningsContainer, { gap: 4 }]}>
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
                token={toToken}
                inputValue={amountTo}
                inputRef={inputToRef}
                tokenAmount={derivedTo.token.displayAmount}
                localAmount={derivedTo.local.displayAmount}
                amountType={amountType}
                onOpenTokenPicker={onOpenTokenPickerTo}
                loading={shouldShowSkeletons}
              />
            </View>

            <View>
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
                fetchingSwapQuote={shouldShowSkeletons}
                appFee={appFee}
                estimatedDurationInSeconds={
                  quote?.swapType === 'cross-chain' ? quote.estimatedDurationInSeconds : undefined
                }
                crossChainFee={crossChainFee}
                networkFee={networkFee}
              />
            </View>
          </View>

          <View style={[styles.warningsContainer, { display: 'flex', justifyContent: 'flex-end' }]}>
            {warnings.showCrossChainFeeWarning && (
              <InLineNotification
                variant={NotificationVariant.Warning}
                title={t('swapScreen.crossChainFeeWarning.title', {
                  tokenSymbol: crossChainFeeCurrency?.symbol,
                })}
                description={t('swapScreen.crossChainFeeWarning.body', {
                  networkName:
                    NETWORK_NAMES[
                      crossChainFeeCurrency?.networkId || networkConfig.defaultNetworkId
                    ],
                  tokenSymbol: crossChainFeeCurrency?.symbol,
                  tokenAmount: crossChainFee?.nativeTokenBalanceDeficit.abs().toFormat(),
                })}
                style={styles.warning}
              />
            )}
            {warnings.showDecreaseSpendForGasWarning && (
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
            {warnings.showNotEnoughBalanceForGasWarning && (
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
            {warnings.showInsufficientBalanceWarning && (
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
            {warnings.showUnsupportedTokensWarning && (
              <InLineNotification
                variant={NotificationVariant.Info}
                title={t('swapScreen.unsupportedTokensWarning.title')}
                description={t('swapScreen.unsupportedTokensWarning.body')}
                style={styles.warning}
              />
            )}
            {warnings.showSwitchedToNetworkWarning && (
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
            {warnings.showMaxSwapAmountWarning && (
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
            {warnings.showPriceImpactWarning && (
              <InLineNotification
                variant={NotificationVariant.Warning}
                title={t('swapScreen.priceImpactWarning.title')}
                description={t('swapScreen.priceImpactWarning.body')}
                style={styles.warning}
              />
            )}
            {warnings.showNoUsdPriceWarning && (
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
            {warnings.showMissingPriceImpactWarning && (
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
        </View>

        <View>
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
            text={t('swapScreen.confirmSwap', {
              context: showUKCompliantVariant ? 'UK' : undefined,
            })}
            size={BtnSizes.FULL}
            disabled={!allowSwap}
            showLoading={confirmSwapIsLoading}
          />
        </View>
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
        showToast={!!toToken && toToken.tokenPositionInList !== undefined}
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
    display: 'flex',
    justifyContent: 'space-between',
  },
  warningsContainer: {
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
