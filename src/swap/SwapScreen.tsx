import { parseInputAmount } from '@celo/utils/lib/parsing'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
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
import MaxAmountWarning from 'src/swap/MaxAmountWarning'
import { swapInfoSelector } from 'src/swap/selectors'
import { setSwapUserInput } from 'src/swap/slice'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import { Field, SwapAmount } from 'src/swap/types'
import useSwapQuote from 'src/swap/useSwapQuote'
import {
  coreTokensSelector,
  swappableTokensSelector,
  tokensByUsdBalanceSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'

const FETCH_UPDATED_QUOTE_DEBOUNCE_TIME = 500
const DEFAULT_FROM_TOKEN_SYMBOL = 'CELO'
const DEFAULT_SWAP_AMOUNT: SwapAmount = {
  [Field.FROM]: '',
  [Field.TO]: '',
}

function tokenCompareByUsdBalanceThenByAlphabetical(token1: TokenBalance, token2: TokenBalance) {
  const token1UsdBalance = token1.balance.multipliedBy(token1.usdPrice ?? 0)
  const token2UsdBalance = token2.balance.multipliedBy(token2.usdPrice ?? 0)
  const usdPriceComparison = token2UsdBalance.comparedTo(token1UsdBalance)
  if (usdPriceComparison === 0) {
    const token1Name = token1.name ?? 'ZZ'
    const token2Name = token2.name ?? 'ZZ'
    return token1Name.localeCompare(token2Name)
  } else {
    return usdPriceComparison
  }
}

const { decimalSeparator } = getNumberFormatSettings()

export function SwapScreen() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { swappingNonNativeTokensEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.SWAPPING_NON_NATIVE_TOKENS]
  )

  const supportedTokens = useSelector(
    swappingNonNativeTokensEnabled ? swappableTokensSelector : coreTokensSelector
  )

  const swapInfo = useSelector(swapInfoSelector)
  const tokensSortedByUsdBalance = useSelector(tokensByUsdBalanceSelector)

  const CELO = useMemo(
    () =>
      supportedTokens.find(
        (token) => token.symbol === DEFAULT_FROM_TOKEN_SYMBOL && token.isCoreToken
      ),
    [supportedTokens]
  )

  const defaultFromToken = useMemo(() => {
    const supportedTokensAddresses = supportedTokens.map((token) => token.address)
    return (
      tokensSortedByUsdBalance.find(
        (token) =>
          token.balance.gt(0) && token.usdPrice && supportedTokensAddresses.includes(token.address)
      ) ?? CELO
    )
  }, [supportedTokens, tokensSortedByUsdBalance])

  const [fromToken, setFromToken] = useState<TokenBalance | undefined>(defaultFromToken)
  const [toToken, setToToken] = useState<TokenBalance | undefined>()

  // Raw input values (can contain region specific decimal separators)
  const [swapAmount, setSwapAmount] = useState(DEFAULT_SWAP_AMOUNT)
  const [updatedField, setUpdatedField] = useState(Field.FROM)
  const [selectingToken, setSelectingToken] = useState<Field | null>(null)
  const [fromSwapAmountError, setFromSwapAmountError] = useState(false)
  const [showMaxSwapAmountWarning, setShowMaxSwapAmountWarning] = useState(false)

  const maxFromAmount = useMaxSendAmount(fromToken?.address || '', FeeType.SWAP)
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

  useEffect(
    () => {
      setSwapAmount((prev) => {
        const otherField = updatedField === Field.FROM ? Field.TO : Field.FROM
        const newAmount = exchangeRate
          ? parsedSwapAmount[updatedField]
              .multipliedBy(new BigNumber(exchangeRate).pow(updatedField === Field.FROM ? 1 : -1))
              .toFormat()
          : ''
        return {
          ...prev,
          [otherField]: newAmount,
        }
      })
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
    Keyboard.addListener('keyboardDidHide', onKeyboardDidHide(fieldType))
    Keyboard.dismiss()
  }

  const onKeyboardDidHide: any = (fieldType: Field) => {
    Keyboard.removeListener('keyboardDidHide', onKeyboardDidHide)
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
        [fieldType]: value,
      }))
    }
    setShowMaxSwapAmountWarning(false)
  }

  const handleSetMaxFromAmount = () => {
    setUpdatedField(Field.FROM)
    setSwapAmount((prev) => ({
      ...prev,
      [Field.FROM]: maxFromAmount.toFormat(),
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

  const sortedTokens = supportedTokens.sort(tokenCompareByUsdBalanceThenByAlphabetical)

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <DrawerTopBar
        middleElement={
          <View style={styles.headerContainer}>
            <Text style={headerStyles.headerTitle}>{t('swapScreen.title')}</Text>
          </View>
        }
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
          >
            {exchangeRate && fromToken && toToken ? (
              <Text style={styles.exchangeRateText}>
                {`1 ${fromToken.symbol} ≈ `}
                <Text style={styles.exchangeRateValueText}>
                  {`${new BigNumber(exchangeRate).toFormat(5, BigNumber.ROUND_DOWN)} ${
                    toToken.symbol
                  }`}
                </Text>
              </Text>
            ) : (
              <Text style={styles.exchangeRateText}>
                <Trans i18nKey={'swapScreen.estimatedExchangeRate'}>
                  <Text style={styles.exchangeRateValueText} />
                </Trans>
              </Text>
            )}
          </SwapAmountInput>
          {showMaxSwapAmountWarning && <MaxAmountWarning />}
        </View>
        <Text style={[styles.disclaimerWrapper, fontStyles.regular, styles.disclaimerText]}>
          <Trans i18nKey="swapScreen.disclaimer">
            <Text
              style={[fontStyles.regular600, styles.disclaimerLink]}
              onPress={onPressLearnMore}
            ></Text>
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
        tokens={sortedTokens}
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
  mutedHeader: {
    color: colors.gray3,
  },
  disclaimerWrapper: {
    paddingBottom: Spacing.Thick24,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  disclaimerText: {
    color: colors.gray5,
    textAlign: 'center',
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
    color: colors.greenUI,
    flexWrap: 'wrap',
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
