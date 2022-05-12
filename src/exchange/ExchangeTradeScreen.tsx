import { parseInputAmount } from '@celo/utils/lib/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { MoneyAmount } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CurrencyDisplay, { getFullCurrencyName } from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import LineItemRow from 'src/components/LineItemRow'
import { CELO_TRANSACTION_MIN_AMOUNT, STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import ExchangeTradeScreenHeader from 'src/exchange/ExchangeScreenHeader'
import { exchangeRatesSelector } from 'src/exchange/reducer'
import InfoIcon from 'src/icons/InfoIcon'
import {
  convertCurrencyToLocalAmount,
  convertLocalAmountToCurrency,
  convertToMaxSupportedPrecision,
} from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { updateLastUsedCurrency } from 'src/send/actions'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { balancesSelector, defaultCurrencySelector } from 'src/stableToken/selectors'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import Logger from 'src/utils/Logger'

const { decimalSeparator } = getNumberFormatSettings()

export enum InputToken {
  Celo = 'Celo',
  LocalCurrency = 'LocalCurrency',
}

type Props = StackScreenProps<StackParamList, Screens.ExchangeTradeScreen>

export default function ExchangeTradeScreen({ route }: Props) {
  const { t } = useTranslation()

  const exchangeRates = useSelector(exchangeRatesSelector)
  const error = useSelector(errorSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const balances = useSelector(balancesSelector)
  const localCurrencyExchangeRates = useSelector(localCurrencyExchangeRatesSelector)
  const defaultCurrency = useSelector(defaultCurrencySelector)

  const { buyCelo } = route.params

  const [inputToken, setInputToken] = useState(InputToken.Celo)
  const [inputAmount, setInputAmount] = useState('') // Raw amount entered
  const [exchangeRateInfoDialogVisible, setExchangeRateInfoDialogVisible] = useState(false)
  const [transferCurrency, setTransferCurrency] = useState(defaultCurrency)

  const dispatch = useDispatch()

  useEffect(() => {
    const sellToken = buyCelo ? defaultCurrency : Currency.Celo
    if (!balances[sellToken]) {
      Logger.error('ExchangeTradeScreen', `${sellToken} balance is missing. Should never happen`)
      dispatch(showError(ErrorMessages.FETCH_FAILED))
      navigateBack()
      return
    }

    dispatch(fetchExchangeRate(sellToken, balances[sellToken]!))
  }, [])

  const onChangeExchangeAmount = (amount: string) => {
    setInputAmount(amount)
  }

  useEffect(() => {
    updateError()
  }, [inputAmount, inputToken])

  const updateError = () => {
    const tokenAmount = getInputTokenAmount()
    if (!inputAmountIsValid(tokenAmount)) {
      dispatch(
        showError(buyCelo ? ErrorMessages.NSF_STABLE : ErrorMessages.NSF_GOLD, null, {
          token: getFullCurrencyName(transferCurrency),
        })
      )
    } else {
      dispatch(hideAlert())
    }
  }

  const goToReview = () => {
    const inputAmount = getInputTokenAmount()
    // BEGIN: Analytics
    const exchangeRate = getRateForMakerToken(exchangeRates, Currency.Celo, transferCurrency)
    const celoAmount =
      inputToken === InputToken.Celo ? inputAmount : exchangeRate.multipliedBy(inputAmount)
    const stableAmount =
      inputToken === InputToken.Celo ? exchangeRate.pow(-1).multipliedBy(inputAmount) : inputAmount
    const localCurrencyAmount = convertCurrencyToLocalAmount(
      stableAmount,
      localCurrencyExchangeRates[transferCurrency]
    )
    const inputCurrency = inputToken === InputToken.Celo ? Currency.Celo : transferCurrency
    ValoraAnalytics.track(
      buyCelo ? CeloExchangeEvents.celo_buy_continue : CeloExchangeEvents.celo_sell_continue,
      {
        localCurrencyAmount: localCurrencyAmount?.toString() ?? null,
        goldAmount: celoAmount.toString(),
        inputToken: inputCurrency,
      }
    )
    // END: Analytics
    const makerToken = getMakerToken()
    navigate(Screens.ExchangeReview, {
      makerToken: makerToken,
      takerToken: getTakerToken(),
      celoAmount,
      stableAmount,
      inputToken: inputCurrency,
      inputTokenDisplayName: getInputTokenDisplayText(),
      inputAmount,
    })
    dispatch(updateLastUsedCurrency(transferCurrency))
  }

  // |tokenAmount| will be in CELO if inputToken === Celo or in |transferCurrency| otherwise.
  const inputAmountIsValid = (tokenAmount: BigNumber) => {
    if (buyCelo) {
      if (inputToken === InputToken.Celo) {
        const exchangeRate = getRateForMakerToken(exchangeRates, Currency.Celo, transferCurrency)
        return getTakerAmount(tokenAmount, exchangeRate).isLessThanOrEqualTo(
          balances[transferCurrency] ?? 0
        )
      } else {
        return tokenAmount.isLessThanOrEqualTo(balances[transferCurrency] ?? 0)
      }
    } else {
      // Selling CELO
      if (inputToken === InputToken.Celo) {
        return tokenAmount.isLessThanOrEqualTo(balances[Currency.Celo] ?? 0)
      } else {
        const exchangeRate = getRateForMakerToken(exchangeRates, transferCurrency, Currency.Celo)
        return getTakerAmount(tokenAmount, exchangeRate).isLessThanOrEqualTo(
          balances[Currency.Celo] ?? 0
        )
      }
    }
  }

  const getMakerToken = () => {
    return buyCelo ? transferCurrency : Currency.Celo
  }

  const getTakerToken = () => {
    return buyCelo ? Currency.Celo : transferCurrency
  }

  const isExchangeInvalid = () => {
    const tokenAmount = getInputTokenAmount()

    const amountIsInvalid =
      !inputAmountIsValid(tokenAmount) ||
      tokenAmount.isLessThan(
        isLocalCurrencyInput() ? STABLE_TRANSACTION_MIN_AMOUNT : CELO_TRANSACTION_MIN_AMOUNT
      )

    const exchangeRate = getRateForMakerToken(exchangeRates, getMakerToken(), getTakerToken())
    const exchangeRateIsInvalid = exchangeRate.isLessThanOrEqualTo(0)
    const takerToken = getTakerToken()
    const takerAmountIsInvalid = getTakerAmount(
      tokenAmount,
      exchangeRate,
      CURRENCIES[takerToken].displayDecimals
    ).isLessThanOrEqualTo(0)

    return amountIsInvalid || exchangeRateIsInvalid || takerAmountIsInvalid || !!error
  }

  const isLocalCurrencyInput = () => {
    return inputToken === InputToken.LocalCurrency
  }

  // Output is one of |CURRENCIES| based on input token
  // Local amounts are converted to one of |STABLE_CURRENCIES|.
  const getInputTokenAmount = () => {
    const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)

    if (inputToken === InputToken.Celo) {
      return parsedInputAmount
    }

    const stableAmount =
      convertLocalAmountToCurrency(
        parsedInputAmount,
        localCurrencyExchangeRates[transferCurrency]
      ) || new BigNumber('')

    return convertToMaxSupportedPrecision(stableAmount)
  }

  const getInputTokenDisplayText = () => {
    return isLocalCurrencyInput() ? localCurrencyCode : t('gold')
  }

  const getOppositeInputTokenDisplayText = () => {
    return isLocalCurrencyInput() ? t('gold') : localCurrencyCode
  }

  const getOppositeInputToken = () => {
    return isLocalCurrencyInput() ? InputToken.Celo : InputToken.LocalCurrency
  }

  const switchInputToken = () => {
    const inputToken = getOppositeInputToken()
    ValoraAnalytics.track(CeloExchangeEvents.celo_toggle_input_currency, {
      to: inputToken,
    })
    setInputToken(inputToken)
  }

  const getSubtotalAmount = (): MoneyAmount => {
    const exchangeRate = getRateForMakerToken(
      exchangeRates,
      inputToken === InputToken.Celo ? Currency.Celo : transferCurrency,
      inputToken === InputToken.Celo ? transferCurrency : Currency.Celo
    )
    const tokenAmount = getInputTokenAmount()
    const subtotalAmount = getTakerAmount(tokenAmount, exchangeRate)

    return {
      value: subtotalAmount,
      currencyCode: inputToken === InputToken.Celo ? transferCurrency : Currency.Celo,
    }
  }

  const toggleExchangeRateInfoDialog = () => {
    setExchangeRateInfoDialogVisible(!exchangeRateInfoDialogVisible)
  }

  const updateTransferCurrency = (currency: Currency) => setTransferCurrency(currency)

  const exchangeRateDisplay = getRateForMakerToken(exchangeRates, transferCurrency, Currency.Celo)

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
      <ExchangeTradeScreenHeader
        currency={transferCurrency}
        isCeloPurchase={buyCelo}
        onChangeCurrency={updateTransferCurrency}
      />
      <DisconnectBanner />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.amountInputContainer}>
          <View>
            <Text style={styles.exchangeBodyText}>
              {t('exchangeAmount', { tokenName: getInputTokenDisplayText() })}
            </Text>
            <TouchableOpacity onPress={switchInputToken} testID="ExchangeSwitchInput">
              <Text style={styles.switchToText}>
                {t('switchTo', { tokenName: getOppositeInputTokenDisplayText() })}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            autoFocus={true}
            keyboardType={'decimal-pad'}
            autoCapitalize="words"
            onChangeText={onChangeExchangeAmount}
            value={inputAmount}
            placeholderTextColor={colors.gray3}
            placeholder={'0'}
            style={styles.currencyInput}
            testID="ExchangeInput"
          />
        </View>
        <LineItemRow
          textStyle={styles.subtotalBodyText}
          title={
            <Trans
              i18nKey="inputSubtotal"
              tOptions={{ context: isLocalCurrencyInput() ? 'gold' : null }}
            >
              Subtotal @{' '}
              <CurrencyDisplay
                amount={{
                  value: exchangeRateDisplay,
                  currencyCode: transferCurrency,
                }}
              />
            </Trans>
          }
          amount={<CurrencyDisplay amount={getSubtotalAmount()} />}
        />
      </KeyboardAwareScrollView>
      <TouchableOpacity onPress={toggleExchangeRateInfoDialog}>
        <LineItemRow
          title={t('exchangeRateInfo')}
          titleIcon={<InfoIcon size={14} />}
          style={styles.exchangeRateInfo}
          textStyle={styles.exchangeRateInfoText}
        />
      </TouchableOpacity>
      <Button
        onPress={goToReview}
        text={t(`review`)}
        accessibilityLabel={t('continue')}
        disabled={isExchangeInvalid()}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        testID="ExchangeReviewButton"
      />
      <Dialog
        title={t('rateInfoTitle')}
        isVisible={exchangeRateInfoDialogVisible}
        actionText={t('dismiss')}
        actionPress={toggleExchangeRateInfoDialog}
        isActionHighlighted={false}
        onBackgroundPress={toggleExchangeRateInfoDialog}
      >
        {t('rateInfoBody')}
      </Dialog>
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    marginTop: 38,
    alignItems: 'center',
    marginBottom: 8,
  },
  exchangeBodyText: {
    ...fontStyles.regular500,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  subtotalBodyText: {
    ...fontStyles.small,
  },
  switchToText: {
    ...fontStyles.small,
    fontSize: 13,
    textDecorationLine: 'underline',
    color: colors.gray4,
    marginTop: 4,
  },
  currencyInput: {
    ...fontStyles.regular,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
    fontSize: 24,
    lineHeight: Platform.select({ android: 39, ios: 30 }), // vertical align = center
    height: 60, // setting height manually b.c. of bug causing text to jump on Android
    color: colors.goldDark,
  },
  exchangeRateInfo: {
    justifyContent: 'center',
  },
  exchangeRateInfoText: {
    ...fontStyles.small,
    color: colors.gray5,
    marginRight: 4,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})
