import { parseInputAmount } from '@celo/utils/lib/parsing'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { TRANSACTION_FEES_LEARN_MORE } from 'src/brandingConfig'
import Button, { BtnSizes } from 'src/components/Button'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { SWAP_LEARN_MORE } from 'src/config'
import { useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { priceImpactWarningThresholdSelector, swapInfoSelector } from 'src/swap/selectors'
import { setSwapUserInput } from 'src/swap/slice'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import { Field, SwapAmount } from 'src/swap/types'
import useSwapQuote from 'src/swap/useSwapQuote'
import Warning from 'src/swap/Warning'
import { swappableTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'

const FETCH_UPDATED_QUOTE_DEBOUNCE_TIME = 500
const DEFAULT_FROM_TOKEN_SYMBOL = 'CELO'
const DEFAULT_SWAP_AMOUNT: SwapAmount = {
  [Field.FROM]: '',
  [Field.TO]: '',
}

const { decimalSeparator } = getNumberFormatSettings()

function SwapScreen() {
  return <SwapScreenSection showDrawerTopNav={true} />
}

export function SwapScreenSection({ showDrawerTopNav }: { showDrawerTopNav: boolean }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { swappingNonNativeTokensEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.SWAPPING_NON_NATIVE_TOKENS]
  )

  // sorted by USD balance and then alphabetical
  const supportedTokens = useSelector(swappableTokensSelector)
  const swappableTokens = useMemo(() => {
    const tokensWithUsdPrice = supportedTokens.filter(
      (token) => token.usdPrice && token.usdPrice.gt(0)
    )
    if (!swappingNonNativeTokensEnabled) {
      return tokensWithUsdPrice.filter((token) => token.isCoreToken)
    }
    return tokensWithUsdPrice
  }, [supportedTokens])

  const swapInfo = useSelector(swapInfoSelector)
  const priceImpactWarningThreshold = useSelector(priceImpactWarningThresholdSelector)

  const CELO = useMemo(
    () =>
      supportedTokens.find(
        (token) => token.symbol === DEFAULT_FROM_TOKEN_SYMBOL && token.isCoreToken
      ),
    [supportedTokens]
  )

  const defaultFromToken = useMemo(() => {
    return swappableTokens[0] ?? CELO
  }, [supportedTokens, swappableTokens])

  const [fromToken, setFromToken] = useState<TokenBalance | undefined>(defaultFromToken)
  const [toToken, setToToken] = useState<TokenBalance | undefined>()

  // Raw input values (can contain region specific decimal separators)
  const [swapAmount, setSwapAmount] = useState(DEFAULT_SWAP_AMOUNT)
  const [updatedField, setUpdatedField] = useState(Field.FROM)
  const [selectingToken, setSelectingToken] = useState<Field | null>(null)
  const [fromSwapAmountError, setFromSwapAmountError] = useState(false)
  const [showMaxSwapAmountWarning, setShowMaxSwapAmountWarning] = useState(false)
  const [showPriceImpactWarning, setShowPriceImpactWarning] = useState(false)

  const maxFromAmountUnchecked = useMaxSendAmount(fromToken?.address || '', FeeType.SWAP)
  const maxFromAmount = maxFromAmountUnchecked.isLessThan(0)
    ? new BigNumber(0)
    : maxFromAmountUnchecked
  // TODO: Check the user has enough balance in native tokens to pay for the gas fee

  const { exchangeRate, refreshQuote, fetchSwapQuoteError, fetchingSwapQuote, clearQuote } =
    useSwapQuote()

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
      setFromToken(defaultFromToken)
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
    const debouncedRefreshQuote = setTimeout(() => {
      if (toToken && fromToken) {
        void refreshQuote(fromToken, toToken, parsedSwapAmount, updatedField)
      }
    }, FETCH_UPDATED_QUOTE_DEBOUNCE_TIME)

    return () => {
      clearTimeout(debouncedRefreshQuote)
    }
  }, [fromToken, toToken, parsedSwapAmount])

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

      const fromFiatValue = swapFromAmount.multipliedBy(fromToken?.usdPrice || 0)
      const toFiatValue = swapToAmount.multipliedBy(toToken?.usdPrice || 0)
      const priceImpact = fromFiatValue.minus(toFiatValue).dividedBy(fromFiatValue)
      const priceImpactExceedsThreshold = priceImpact.gte(priceImpactWarningThreshold)
      setShowPriceImpactWarning(priceImpactExceedsThreshold)

      if (priceImpactExceedsThreshold) {
        ValoraAnalytics.track(SwapEvents.swap_price_impact_warning_displayed, {
          toToken: exchangeRate.toTokenAddress,
          fromToken: exchangeRate.fromTokenAddress,
          amount: parsedSwapAmount[updatedField].toString(),
          amountType: updatedField === Field.FROM ? 'sellAmount' : 'buyAmount',
          priceImpact: priceImpact.toString(),
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

    if (parsedSwapAmount[Field.FROM].gt(maxFromAmount)) {
      setFromSwapAmountError(true)
      showMaxCeloSwapWarning()
      dispatch(showError(t('swapScreen.insufficientFunds', { token: fromToken?.symbol })))
    } else {
      dispatch(
        setSwapUserInput({
          toToken: toToken!.address,
          fromToken: fromToken!.address,
          swapAmount: {
            [Field.FROM]: parsedSwapAmount[Field.FROM].toString(),
            [Field.TO]: parsedSwapAmount[Field.TO].toString(),
          },
          updatedField,
        })
      )
      navigate(Screens.SwapReviewScreen)
    }
  }

  const handleShowTokenSelect = (fieldType: Field) => () => {
    ValoraAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType })
    // ensure that the keyboard is dismissed before animating token bottom sheet
    Keyboard.dismiss()
    setSelectingToken(fieldType)
  }

  const handleCloseTokenSelect = () => {
    setSelectingToken(null)
  }

  const handleSelectToken = (tokenAddress: string) => {
    const selectedToken = supportedTokens.find((token) => token.address === tokenAddress)
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
    setShowPriceImpactWarning(false)
  }

  const handleSetMaxFromAmount = () => {
    setUpdatedField(Field.FROM)
    setSwapAmount((prev) => ({
      ...prev,
      [Field.FROM]: maxFromAmount.toFormat({
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

  const edges: Edge[] | undefined = showDrawerTopNav ? undefined : ['bottom']
  const exchangeRateUpdatePending =
    exchangeRate &&
    (exchangeRate.fromTokenAddress !== fromToken?.address ||
      exchangeRate.toTokenAddress !== toToken?.address ||
      !exchangeRate.swapAmount.eq(parsedSwapAmount[updatedField]))

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={edges}>
      {showDrawerTopNav && (
        <DrawerTopBar
          testID={'SwapScreen/DrawerBar'}
          middleElement={
            <View style={styles.headerContainer}>
              <Text style={headerStyles.headerTitle}>{t('swapScreen.title')}</Text>
            </View>
          }
        />
      )}
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
          {showMaxSwapAmountWarning && (
            <Warning
              title={t('swapScreen.maxSwapAmountWarning.title')}
              description={t('swapScreen.maxSwapAmountWarning.body')}
              ctaLabel={t('swapScreen.maxSwapAmountWarning.learnMore')}
              onPressCta={onPressLearnMoreFees}
            />
          )}
          {showPriceImpactWarning && (
            <Warning
              title={t('swapScreen.priceImpactWarning.title')}
              description={t('swapScreen.priceImpactWarning.body')}
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
        isVisible={!!selectingToken}
        origin={TokenPickerOrigin.Swap}
        onTokenSelected={handleSelectToken}
        onClose={handleCloseTokenSelect}
        searchEnabled={swappingNonNativeTokensEnabled}
        tokens={supportedTokens}
        title={
          selectingToken == Field.FROM
            ? t('swapScreen.swapFromTokenSelection')
            : t('swapScreen.swapToTokenSelection')
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
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
  },
  disclaimerText: {
    ...fontStyles.xsmall,
    paddingBottom: Spacing.Thick24,
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
})

export default SwapScreen
