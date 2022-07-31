import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { Spacing } from 'src/styles/styles'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import useSwapQuote, { Field, SwapAmount } from 'src/swap/useSwapQuote'
import { coreTokensSelector } from 'src/tokens/selectors'

const FETCH_UPDATED_QUOTE_TIMEOUT = 300
const DEFAULT_TO_TOKEN = 'cUSD'
const DEFAULT_FROM_TOKEN = 'CELO'
const DEFAULT_SWAP_AMOUNT: SwapAmount = {
  [Field.FROM]: null,
  [Field.TO]: null,
}

export function SwapScreen() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const coreTokens = useSelector(coreTokensSelector)

  const [toToken, setToToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_TO_TOKEN)
  )
  const [fromToken, setFromToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_FROM_TOKEN)
  )
  const [swapAmount, setSwapAmount] = useState(DEFAULT_SWAP_AMOUNT)
  const [updatedField, setUpdatedField] = useState(Field.FROM)
  const [selectingToken, setSelectingToken] = useState<Field | null>(null)
  const [fromSwapAmountError, setFromSwapAmountError] = useState(false)

  const maxFromAmount = useMaxSendAmount(fromToken?.address || '', FeeType.SWAP)
  const { exchangeRate, refreshQuote, fetchSwapQuoteError } = useSwapQuote()

  useEffect(() => {
    ValoraAnalytics.track(SwapEvents.swap_screen_open)
  }, [])

  useEffect(() => {
    if (fetchSwapQuoteError) {
      dispatch(showError(t('swapScreen.fetchSwapQuoteFailed')))
    }
  }, [fetchSwapQuoteError])

  useEffect(() => {
    setFromSwapAmountError(false)
    const debouncedRefreshQuote = setTimeout(() => {
      const isExchangeRateRefreshed =
        exchangeRate &&
        new BigNumber(swapAmount[Field.FROM] ?? 0)
          .multipliedBy(new BigNumber(exchangeRate))
          .toString() === swapAmount[Field.TO]
      if (toToken && fromToken && !isExchangeRateRefreshed) {
        void refreshQuote(fromToken, toToken, swapAmount, updatedField)
      }
    }, FETCH_UPDATED_QUOTE_TIMEOUT)

    return () => {
      clearTimeout(debouncedRefreshQuote)
    }
  }, [fromToken, toToken, swapAmount])

  useEffect(() => {
    if (updatedField === Field.TO && swapAmount[updatedField]) {
      setSwapAmount((prev) => ({
        ...prev,
        [Field.FROM]: exchangeRate
          ? new BigNumber(prev[updatedField]!).dividedBy(new BigNumber(exchangeRate)).toString()
          : null,
      }))
    } else if (updatedField === Field.FROM && swapAmount[updatedField]) {
      setSwapAmount((prev) => ({
        ...prev,
        [Field.TO]: exchangeRate
          ? new BigNumber(prev[updatedField]!).multipliedBy(new BigNumber(exchangeRate)).toString()
          : null,
      }))
    }
  }, [exchangeRate])

  const handleReview = () => {
    ValoraAnalytics.track(SwapEvents.swap_screen_review_swap)

    if (new BigNumber(swapAmount[Field.FROM] ?? 0).gt(maxFromAmount)) {
      setFromSwapAmountError(true)
      dispatch(showError(t('swapScreen.insufficientFunds', { token: fromToken?.symbol })))
    } else {
      // navigate to the review screen, not yet implemented
    }
  }

  const handleShowTokenSelect = (fieldType: Field) => () => {
    ValoraAnalytics.track(SwapEvents.swap_screen_select_token, { fieldType })
    Keyboard.dismiss()
    // ensure that the keyboard is dismissed before animating token bottom sheet
    setTimeout(() => {
      setSelectingToken(fieldType)
    }, 100)
  }

  const handleCloseTokenSelect = () => {
    setSelectingToken(null)
  }

  const handleSelectToken = (tokenAddress: string) => {
    const selectedToken = coreTokens.find((token) => token.address === tokenAddress)
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

    if (fromToken && toToken && selectingToken) {
      void refreshQuote(fromToken, toToken, swapAmount, selectingToken)
    }

    setSelectingToken(null)
  }

  const handleChangeAmount = (fieldType: Field) => (value: string) => {
    if (!value) {
      setSwapAmount(DEFAULT_SWAP_AMOUNT)
    } else {
      setUpdatedField(fieldType)
      setSwapAmount((prev) => ({
        ...prev,
        [fieldType]: value,
      }))
    }
  }

  const handleSetMaxFromAmount = () => {
    setUpdatedField(Field.FROM)
    setSwapAmount((prev) => ({
      ...prev,
      [Field.FROM]: maxFromAmount.toString(),
    }))
  }

  const allowReview = useMemo(
    () =>
      Object.values(swapAmount).every((amount) => amount !== null && new BigNumber(amount).gt(0)),
    [swapAmount]
  )

  if (!toToken || !fromToken) {
    // should not happen
    return null
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <DrawerTopBar
        middleElement={
          <View style={styles.headerContainer}>
            <Text style={headerStyles.headerTitle}>{t('swapScreen.title')}</Text>
            {exchangeRate && (
              <Text style={headerStyles.headerSubTitle}>
                {`1 ${toToken.symbol} ≈ ${exchangeRate.substring(0, 7)} ${fromToken.symbol}`}
              </Text>
            )}
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
            autoFocus
            inputError={fromSwapAmountError}
            onPressMax={handleSetMaxFromAmount}
          />
          <SwapAmountInput
            label={t('swapScreen.swapTo')}
            onInputChange={handleChangeAmount(Field.TO)}
            inputValue={swapAmount[Field.TO]}
            onSelectToken={handleShowTokenSelect(Field.TO)}
            token={toToken}
            style={styles.toSwapAmountInput}
          />
        </View>
        <Button
          onPress={handleReview}
          text={t('swapScreen.review')}
          size={BtnSizes.FULL}
          disabled={!allowReview}
        />
        <KeyboardSpacer topSpacing={Spacing.Regular16} />

        <TokenBottomSheet
          isVisible={!!selectingToken}
          origin={TokenPickerOrigin.Swap}
          onTokenSelected={handleSelectToken}
          onClose={handleCloseTokenSelect}
          tokens={Object.values(coreTokens)}
        />
      </KeyboardAwareScrollView>
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
    flex: 1,
  },
  swapAmountsContainer: {
    paddingBottom: Spacing.Thick24,
    flex: 1,
  },
  fromSwapAmountInput: {
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  toSwapAmountInput: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
})

export default SwapScreen
