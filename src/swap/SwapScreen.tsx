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
import { coreTokensSelector } from 'src/tokens/selectors'

export enum Field {
  FROM = 'FROM',
  TO = 'TO',
}

const DEFAULT_TO_TOKEN = 'cUSD'
const DEFAULT_FROM_TOKEN = 'CELO'
const DEFAULT_SWAP_AMOUNT: {
  [Field.FROM]: null | string
  [Field.TO]: null | string
} = {
  [Field.FROM]: null,
  [Field.TO]: null,
}

export function SwapScreen() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const coreTokens = useSelector(coreTokensSelector)

  const [exchangeRate, setExchangeRate] = useState<string | null>(null)
  const [toToken, setToToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_TO_TOKEN)
  )
  const [fromToken, setFromToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_FROM_TOKEN)
  )
  const [swapAmount, setSwapAmount] = useState(DEFAULT_SWAP_AMOUNT)
  const [selectingToken, setSelectingToken] = useState<Field | null>(null)
  const [fromSwapAmountError, setFromSwapAmountError] = useState(false)

  const maxFromAmount = useMaxSendAmount(fromToken?.address || '', FeeType.SWAP)

  useEffect(() => {
    ValoraAnalytics.track(SwapEvents.swap_screen_open)
  }, [])

  useEffect(() => {
    setFromSwapAmountError(false)
  }, [fromToken, toToken, swapAmount])

  useEffect(() => {
    setExchangeRate(null)
    // mimic delay when fetching real exchange rate
    setTimeout(() => {
      setExchangeRate(fromToken?.symbol === 'cEUR' ? '7.123' : '3.325')
    }, 1000)
  }, [toToken, fromToken])

  useEffect(() => {
    setSwapAmount((prev) => {
      // when the token pair changes, we use the updated exchange rate to
      // calculate the "to" value except when only the "to" value is present
      if (!prev[Field.FROM] && prev[Field.TO]) {
        return {
          ...prev,
          [Field.FROM]: exchangeRate
            ? new BigNumber(prev[Field.TO] ?? 0).dividedBy(exchangeRate).toString()
            : null,
        }
      }
      return {
        ...prev,
        [Field.TO]:
          exchangeRate && prev[Field.FROM]
            ? new BigNumber(prev[Field.FROM] ?? 0).multipliedBy(exchangeRate).toString()
            : null,
      }
    })
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
        tokenSymbol: selectedToken?.symbol,
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
    } else if (fieldType === Field.FROM) {
      setSwapAmount({
        [Field.FROM]: value,
        [Field.TO]: exchangeRate
          ? new BigNumber(value).multipliedBy(exchangeRate).toString()
          : null,
      })
    } else if (fieldType === Field.TO) {
      setSwapAmount({
        [Field.TO]: value,
        [Field.FROM]: exchangeRate ? new BigNumber(value).dividedBy(exchangeRate).toString() : null,
      })
    }
  }

  const handleSetMaxFromAmount = () => {
    setSwapAmount({
      [Field.FROM]: maxFromAmount.toString(),
      [Field.TO]: exchangeRate ? maxFromAmount.multipliedBy(exchangeRate).toString() : null,
    })
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
                {`1 ${toToken.symbol} ≈ ${exchangeRate} ${fromToken.symbol}`}
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
            onPressMax={handleSetMaxFromAmount}
            onSelectToken={handleShowTokenSelect(Field.FROM)}
            token={fromToken}
            autoFocus
            inputError={fromSwapAmountError}
            style={styles.fromSwapAmountInput}
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
