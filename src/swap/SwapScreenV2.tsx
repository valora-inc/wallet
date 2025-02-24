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
import EnterAmountOptions from 'src/send/EnterAmountOptions'
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
import { currentSwapSelector } from 'src/swap/selectors'
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
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import networkConfig from 'src/web3/networkConfig'
import { getSupportedNetworkIds } from 'src/web3/utils'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'SwapScreen'

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

export default function SwapScreenV2({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const allowCrossChainSwaps = getFeatureGate(StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS)
  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)
  const { swappableFromTokens, swappableToTokens, areSwapTokensShuffled } = useSwappableTokens()
  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])
  const { maxSlippagePercentage, enableAppFee, priceImpactWarningThreshold } =
    getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG])

  const inputFromRef = useRef<RNTextInput>(null)
  const inputToRef = useRef<RNTextInput>(null)
  const tokenBottomSheetFromRef = useRef<BottomSheetModalRefType>(null)
  const tokenBottomSheetToRef = useRef<BottomSheetModalRefType>(null)
  const exchangeRateInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const feeInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const slippageInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const estimatedDurationBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const [noUsdPriceToken, setNoUsdPriceToken] = useState<
    { token: TokenBalance; tokenPositionInList: number } | undefined
  >(undefined)
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null)
  const [startedSwapId, setStartedSwapId] = useState<string | undefined>(undefined)
  const [switchedToNetworkId, setSwitchedToNetworkId] = useState<{
    networkId: NetworkId
    field: Field
  } | null>(null)
  const [fromToken, setFromToken] = useState(() => {
    if (!route.params?.fromTokenId) return undefined
    return swappableFromTokens.find((token) => token.tokenId === route.params!.fromTokenId)
  })
  const [toToken, setToToken] = useState(() => {
    if (!route.params?.toTokenId) return undefined
    return swappableToTokens.find((token) => token.tokenId === route.params!.toTokenId)
  })

  const currentSwap = useSelector(currentSwapSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const tokensById = useSelector((state) => tokensByIdSelector(state, getSupportedNetworkIds()))
  const crossChainFeeCurrency = useSelector((state) =>
    feeCurrenciesSelector(state, fromToken?.networkId || networkConfig.defaultNetworkId)
  ).find((token) => token.isNative)
  const feeCurrenciesWithPositiveBalances = useSelector((state) =>
    feeCurrenciesWithPositiveBalancesSelector(
      state,
      fromToken?.networkId || networkConfig.defaultNetworkId
    )
  )

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

      if (!processedAmountsFrom.token.bignum) {
        return
      }

      const newAmount = processedAmountsFrom.token.bignum
        .multipliedBy(new BigNumber(newQuote.price))
        .toString()

      replaceAmountTo(newAmount)
    },
  })

  const {
    amount: amountFrom,
    amountType: amountTypeFrom,
    processedAmounts: processedAmountsFrom,
    handleAmountInputChange,
    handleToggleAmountType: handleToggleAmountTypeFrom,
    handleSelectPercentageAmount,
  } = useEnterAmount({
    inputRef: inputFromRef,
    token: fromToken,
    onHandleAmountInputChange: () => {
      setSelectedPercentage(null)
    },
  })

  const {
    amount: amountTo,
    amountType: amountTypeTo,
    processedAmounts: processedAmountsTo,
    replaceAmount: replaceAmountTo,
    handleToggleAmountType: handleToggleAmountTypeTo,
  } = useEnterAmount({ token: toToken, inputRef: inputToRef })

  const filterChipsFrom = useFilterChips(Field.FROM)
  const filterChipsTo = useFilterChips(Field.TO, route.params?.toTokenNetworkId)
  const parsedSlippagePercentage = new BigNumber(maxSlippagePercentage).toFormat()
  const crossChainFee =
    quote?.swapType === 'cross-chain'
      ? getCrossChainFee({
          feeCurrency: crossChainFeeCurrency,
          preparedTransactions: quote.preparedTransactions,
          fromTokenId: quote.fromTokenId,
          sellAmount: quote.sellAmount,
          estimatedCrossChainFee: quote.estimatedCrossChainFee,
          maxCrossChainFee: quote.maxCrossChainFee,
        })
      : undefined
  const swapStatus = startedSwapId === currentSwap?.id ? currentSwap?.status : null
  const confirmSwapIsLoading = swapStatus === 'started'
  const confirmSwapFailed = swapStatus === 'error'
  const switchedToNetworkName = switchedToNetworkId && NETWORK_NAMES[switchedToNetworkId.networkId]
  const showCrossChainSwapNotification =
    toToken && fromToken && toToken.networkId !== fromToken.networkId && allowCrossChainSwaps
  const feeCurrencies =
    quote && quote.preparedTransactions.type === 'not-enough-balance-for-gas'
      ? quote.preparedTransactions.feeCurrencies.map((feeCurrency) => feeCurrency.symbol).join(', ')
      : ''

  const networkFee = useMemo(() => getNetworkFee(quote), [fromToken, quote])
  const feeToken = networkFee?.token ? tokensById[networkFee.token.tokenId] : undefined

  const appFee: AppFeeAmount | undefined = useMemo(() => {
    if (!quote || !fromToken || !processedAmountsFrom.token.bignum) {
      return undefined
    }

    const percentage = new BigNumber(quote.appFeePercentageIncludedInPrice || 0)

    return {
      amount: processedAmountsFrom.token.bignum.multipliedBy(percentage).dividedBy(100),
      token: fromToken,
      percentage,
    }
  }, [quote, processedAmountsFrom.token.bignum, fromToken])

  const shouldShowSkeletons = useMemo(() => {
    if (fetchingSwapQuote) return true

    if (
      quote &&
      (quote.fromTokenId !== fromToken?.tokenId || quote.toTokenId !== toToken?.tokenId)
    ) {
      return true
    }

    if (
      quote &&
      processedAmountsFrom.token.bignum &&
      !quote.swapAmount.eq(processedAmountsFrom.token.bignum)
    ) {
      return true
    }

    return false
  }, [fetchingSwapQuote, quote, fromToken, toToken, processedAmountsFrom])

  const warnings = useMemo(() => {
    const shouldShowMaxSwapAmountWarning =
      feeCurrenciesWithPositiveBalances.length === 1 &&
      fromToken &&
      fromToken.tokenId === feeCurrenciesWithPositiveBalances[0].tokenId &&
      fromToken.balance.gt(0) &&
      processedAmountsFrom.token.bignum &&
      processedAmountsFrom.token.bignum.gte(fromToken.balance)

    // NOTE: If a new condition is added here, make sure to update `allowSwap` below if
    // the condition should prevent the user from swapping.
    const checks = {
      showSwitchedToNetworkWarning: !!switchedToNetworkId,
      showUnsupportedTokensWarning:
        !shouldShowSkeletons && fetchSwapQuoteError?.message.includes(NO_QUOTE_ERROR_MESSAGE),
      showInsufficientBalanceWarning:
        fromToken &&
        processedAmountsFrom.token.bignum &&
        processedAmountsFrom.token.bignum.gt(fromToken.balance),
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
    processedAmountsFrom,
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
      processedAmountsFrom.token.bignum &&
      processedAmountsFrom.token.bignum.gt(0) &&
      processedAmountsTo.token.bignum &&
      processedAmountsTo.token.bignum.gt(0),
    [
      processedAmountsFrom.token.bignum,
      processedAmountsTo.token.bignum,
      shouldShowSkeletons,
      confirmSwapIsLoading,
      warnings.showInsufficientBalanceWarning,
      warnings.showDecreaseSpendForGasWarning,
      warnings.showNotEnoughBalanceForGasWarning,
      warnings.showCrossChainFeeWarning,
    ]
  )

  useEffect(
    function refreshTransactionQuote() {
      setStartedSwapId(undefined)
      if (!processedAmountsFrom.token.bignum) {
        clearQuote()
        replaceAmountTo('')
        return
      }

      const debounceTimeout = setTimeout(() => {
        const bothTokensPresent = !!(fromToken && toToken)
        const amountIsTooSmall =
          !processedAmountsFrom.token.bignum || processedAmountsFrom.token.bignum.lte(0)

        if (!bothTokensPresent || amountIsTooSmall) {
          return
        }

        // This variable prevents the quote from needlessly being fetched again.
        const quoteIsTheSameAsTheLastOne =
          quote &&
          quote.toTokenId === toToken.tokenId &&
          quote.fromTokenId === fromToken.tokenId &&
          processedAmountsFrom.token.bignum &&
          quote.swapAmount.eq(processedAmountsFrom.token.bignum)

        if (!quoteIsTheSameAsTheLastOne) {
          replaceAmountTo('')
          void refreshQuote(
            fromToken,
            toToken,
            { FROM: processedAmountsFrom.token.bignum, TO: null },
            Field.FROM
          )
        }
      }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS)

      return () => {
        clearTimeout(debounceTimeout)
      }
    },
    [
      processedAmountsFrom.token.bignum?.toString(),
      fromToken,
      toToken,
      quote,
      refreshQuote,
      /**
       * TODO
       * This useEffect doesn't follow the rules of hooks which can introduce unnecessary bugs.
       * Functions below should be optimized to not cause unnecessary re-runs. Once that's done -
       * they should be uncommented.
       */
      // clearQuote,
      // replaceAmountTo,
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
          amount: processedAmountsFrom.token.bignum
            ? processedAmountsFrom.token.bignum.toString()
            : '',
          amountType: 'sellAmount',
          priceImpact: quote.estimatedPriceImpact,
          provider: quote.provider,
        })
      }
    },
    [warnings.showPriceImpactWarning || warnings.showMissingPriceImpactWarning]
  )

  function handleOpenTokenPicker(field: Field) {
    AppAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType: field })
    // use requestAnimationFrame so that the bottom sheet open animation is done
    // after the selectingField value is updated, so that the title of the
    // bottom sheet (which depends on selectingField) does not change on the
    // screen
    requestAnimationFrame(() => {
      const ref = field === Field.FROM ? tokenBottomSheetFromRef : tokenBottomSheetToRef
      ref.current?.snapToIndex(0)
    })
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
        [Field.FROM]: processedAmountsFrom.token.bignum?.toString() ?? '',
        [Field.TO]: processedAmountsTo.token.bignum?.toString() ?? '',
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
        const swapId = uuidv4()

        AppAnalytics.track(SwapEvents.swap_review_submit, {
          swapId,
          toToken: toToken.address,
          toTokenId: toToken.tokenId,
          toTokenNetworkId: toToken.networkId,
          toTokenIsImported: !!toToken.isManuallyImported,
          fromToken: fromToken.address,
          fromTokenId: fromToken.tokenId,
          fromTokenNetworkId: fromToken.networkId,
          fromTokenIsImported: !!fromToken.isManuallyImported,
          amount: processedAmountsFrom.token.bignum?.toString() || '',
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
  }

  function handleConfirmSelectTokenNoUsdPrice() {
    if (noUsdPriceToken) {
      handleConfirmSelectToken({
        field: Field.TO,
        selectedToken: noUsdPriceToken.token,
        tokenPositionInList: noUsdPriceToken.tokenPositionInList,
      })
      setNoUsdPriceToken(undefined)
    }
  }

  function handleDismissSelectTokenNoUsdPrice() {
    setNoUsdPriceToken(undefined)
  }

  const handleConfirmSelectToken = ({
    field,
    selectedToken,
    tokenPositionInList,
  }: {
    field: Field
    selectedToken: TokenBalance
    tokenPositionInList: number
  }) => {
    if (!field) {
      // Should never happen
      Logger.error(TAG, 'handleConfirmSelectToken called without field')
      return
    }

    let newFromToken = fromToken
    let newToToken = toToken
    let newSwitchedToNetwork: typeof switchedToNetworkId | null = null

    switch (true) {
      // If we're selecting a field that was already selected in the other input then switch inputs
      case (field === Field.FROM && toToken?.tokenId === selectedToken.tokenId) ||
        (field === Field.TO && fromToken?.tokenId === selectedToken.tokenId): {
        newFromToken = toToken
        newToToken = fromToken
        break
      }

      case field === Field.FROM: {
        newFromToken = selectedToken
        newSwitchedToNetwork =
          toToken && toToken.networkId !== newFromToken.networkId && !allowCrossChainSwaps
            ? { networkId: newFromToken.networkId, field: Field.FROM }
            : null
        if (newSwitchedToNetwork) {
          // reset the toToken if the user is switching networks
          newToToken = undefined
        }
        break
      }

      case field === Field.TO: {
        if (!selectedToken.priceUsd && !noUsdPriceToken) {
          setNoUsdPriceToken({ token: selectedToken, tokenPositionInList })
          return
        }

        newToToken = selectedToken
        newSwitchedToNetwork =
          fromToken && fromToken.networkId !== newToToken.networkId && !allowCrossChainSwaps
            ? { networkId: newToToken.networkId, field: Field.TO }
            : null
        if (newSwitchedToNetwork) {
          // reset the fromToken if the user is switching networks
          newFromToken = undefined
        }
      }
    }

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
      switchedNetworkId: !!newSwitchedToNetwork,
      areSwapTokensShuffled,
      tokenPositionInList,
    })

    setFromToken(newFromToken)
    setToToken(newToToken)
    setSwitchedToNetworkId(allowCrossChainSwaps ? null : newSwitchedToNetwork)
    setStartedSwapId(undefined)
    replaceAmountTo('')

    if (newSwitchedToNetwork) {
      clearQuote()
    }

    // use requestAnimationFrame so that the bottom sheet and keyboard dismiss
    // animation can be synchronised and starts after the state changes above.
    // without this, the keyboard animation lags behind the state updates while
    // the bottom sheet does not
    requestAnimationFrame(() => {
      const ref = field === Field.FROM ? tokenBottomSheetFromRef : tokenBottomSheetToRef
      ref.current?.close()
    })
  }

  function handleToggleAmountType() {
    const newAmountType = handleToggleAmountTypeFrom()
    handleToggleAmountTypeTo(newAmountType)
  }

  function handleSelectAmountPercentage(percentage: number) {
    handleSelectPercentageAmount(percentage)
    setSelectedPercentage(percentage)

    if (!fromToken) {
      // Should never happen
      return
    }
    AppAnalytics.track(SwapEvents.swap_screen_percentage_selected, {
      tokenSymbol: fromToken.symbol,
      tokenId: fromToken.tokenId,
      tokenNetworkId: fromToken.networkId,
      percentage,
    })
  }

  function handlePressLearnMore() {
    AppAnalytics.track(SwapEvents.swap_learn_more)
    navigate(Screens.WebViewScreen, { uri: links.swapLearnMore })
  }

  function handlePressLearnMoreFees() {
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
        <View style={styles.inputsAndWarningsContainer}>
          <View>
            <View style={styles.inputsContainer}>
              <TokenEnterAmount
                autoFocus
                token={fromToken}
                inputValue={amountFrom}
                inputRef={inputFromRef}
                tokenAmount={processedAmountsFrom.token.displayAmount}
                localAmount={processedAmountsFrom.local.displayAmount}
                onInputChange={handleAmountInputChange}
                amountType={amountTypeFrom}
                toggleAmountType={handleToggleAmountType}
                onOpenTokenPicker={() => handleOpenTokenPicker(Field.FROM)}
                testID="SwapAmountInput"
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
                  <CircledIcon radius={Spacing.Large32} backgroundColor={colors.contentPrimary}>
                    <ArrowDown color={colors.backgroundPrimary} />
                  </CircledIcon>
                </Touchable>
              </View>
              <TokenEnterAmount
                token={toToken}
                inputValue={amountTo}
                inputRef={inputToRef}
                tokenAmount={processedAmountsTo.token.displayAmount}
                localAmount={processedAmountsTo.local.displayAmount}
                amountType={amountTypeTo}
                onOpenTokenPicker={() => handleOpenTokenPicker(Field.TO)}
                loading={shouldShowSkeletons}
                testID="SwapAmountInput"
              />
            </View>

            {showCrossChainSwapNotification && (
              <View style={styles.crossChainNotificationWrapper}>
                <CrossChainIndicator backgroundColor={colors.contentSecondary} />
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
              swapAmount={processedAmountsFrom.token.bignum ?? undefined}
              fetchingSwapQuote={shouldShowSkeletons}
              appFee={appFee}
              estimatedDurationInSeconds={
                quote?.swapType === 'cross-chain' ? quote.estimatedDurationInSeconds : undefined
              }
              crossChainFee={crossChainFee}
              networkFee={networkFee}
            />
          </View>

          <View style={styles.warningsContainer}>
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
                  handleAmountInputChange(
                    quote.preparedTransactions.decreasedSpendAmount.toString()
                  )
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
                  context: switchedToNetworkId?.field === Field.FROM ? 'swapTo' : 'swapFrom',
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
                onPressCta={handlePressLearnMoreFees}
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
              <Text style={styles.disclaimerLink} onPress={handlePressLearnMore}></Text>
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

      <EnterAmountOptions
        onPressAmount={handleSelectAmountPercentage}
        selectedAmount={selectedPercentage}
        testID="SwapEnterAmount/AmountOptions"
      />

      <TokenBottomSheet
        searchEnabled
        showPriceUsdUnavailableWarning
        key="TokenBottomSheet/From"
        snapPoints={['90%']}
        title={t('swapScreen.tokenBottomSheetTitle')}
        origin={TokenPickerOrigin.SwapFrom}
        forwardedRef={tokenBottomSheetFromRef}
        tokens={swappableFromTokens}
        filterChips={filterChipsFrom}
        onTokenSelected={(token, tokenPositionInList) => {
          handleConfirmSelectToken({ field: Field.FROM, selectedToken: token, tokenPositionInList })
        }}
        areSwapTokensShuffled={areSwapTokensShuffled}
      />
      <TokenBottomSheet
        searchEnabled
        showPriceUsdUnavailableWarning
        key="TokenBottomSheet/To"
        snapPoints={['90%']}
        title={t('swapScreen.tokenBottomSheetTitle')}
        origin={TokenPickerOrigin.SwapTo}
        forwardedRef={tokenBottomSheetToRef}
        tokens={swappableToTokens}
        filterChips={filterChipsTo}
        onTokenSelected={(token, tokenPositionInList) => {
          handleConfirmSelectToken({ field: Field.TO, selectedToken: token, tokenPositionInList })
        }}
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
        showToast={!!noUsdPriceToken}
        variant={NotificationVariant.Warning}
        title={t('swapScreen.noUsdPriceWarning.title', { localCurrency })}
        description={t('swapScreen.noUsdPriceWarning.description', {
          localCurrency,
          tokenSymbol: noUsdPriceToken?.token.symbol,
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
  inputsAndWarningsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  inputsContainer: {
    paddingBottom: Spacing.Small12,
    flex: 1,
    gap: 4,
  },
  warningsContainer: {
    paddingBottom: Spacing.Thick24,
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  disclaimerText: {
    ...typeScale.labelXXSmall,
    paddingBottom: Spacing.Smallest8,
    flexWrap: 'wrap',
    color: colors.contentSecondary,
    textAlign: 'center',
  },
  disclaimerLink: {
    ...typeScale.labelXXSmall,
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
    color: colors.contentSecondary,
  },
})
