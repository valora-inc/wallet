import { parseInputAmount } from '@celo/utils/lib/parsing'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import { swapInfoSelector } from 'src/swap/selectors'
import { setSwapUserInput } from 'src/swap/slice'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import { Field, SwapAmount } from 'src/swap/types'
import useSwapQuote from 'src/swap/useSwapQuote'
import { coreTokensSelector } from 'src/tokens/selectors'

const FETCH_UPDATED_QUOTE_DEBOUNCE_TIME = 500
const DEFAULT_TO_TOKEN = 'cUSD'
const DEFAULT_FROM_TOKEN = 'CELO'
const DEFAULT_SWAP_AMOUNT: SwapAmount = {
  [Field.FROM]: '',
  [Field.TO]: '',
}

const { decimalSeparator } = getNumberFormatSettings()

export function SwapScreen() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const coreTokens = useSelector(coreTokensSelector)
  const swapInfo = useSelector(swapInfoSelector)

  const [toToken, setToToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_TO_TOKEN)
  )
  const [fromToken, setFromToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_FROM_TOKEN)
  )
  // Raw input values (can contain region specific decimal separators)
  const [swapAmount, setSwapAmount] = useState(DEFAULT_SWAP_AMOUNT)
  const [updatedField, setUpdatedField] = useState(Field.FROM)
  const [selectingToken, setSelectingToken] = useState<Field | null>(null)
  const [fromSwapAmountError, setFromSwapAmountError] = useState(false)

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
      setFromToken(coreTokens.find((token) => token.symbol === DEFAULT_FROM_TOKEN))
      setToToken(coreTokens.find((token) => token.symbol === DEFAULT_TO_TOKEN))
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
  }

  const handleSetMaxFromAmount = () => {
    setUpdatedField(Field.FROM)
    setSwapAmount((prev) => ({
      ...prev,
      [Field.FROM]: maxFromAmount.toFormat(),
    }))
  }

  const allowReview = useMemo(
    () => Object.values(parsedSwapAmount).every((amount) => amount.gt(0)),
    [parsedSwapAmount]
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
              <Text
                style={[headerStyles.headerSubTitle, fetchingSwapQuote ? styles.mutedHeader : {}]}
              >
                {`1 ${fromToken.symbol} ≈ ${new BigNumber(exchangeRate).toFormat(
                  5,
                  BigNumber.ROUND_DOWN
                )} ${toToken.symbol}`}
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
            loading={updatedField === Field.TO && fetchingSwapQuote}
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
            loading={updatedField === Field.FROM && fetchingSwapQuote}
          />
        </View>
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
        tokens={Object.values(coreTokens)}
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
  mutedHeader: {
    color: colors.gray500,
  },
})

export default SwapScreen
