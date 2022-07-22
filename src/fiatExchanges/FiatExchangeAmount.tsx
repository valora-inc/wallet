import { parseInputAmount } from '@celo/utils/lib/parsing'
import { RouteProp } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { cUsdDailyLimitSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import {
  ALERT_BANNER_DURATION,
  CELO_SUPPORT_EMAIL_ADDRESS,
  DOLLAR_ADD_FUNDS_MAX_AMOUNT,
} from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import { useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import { cachedFiatAccountsSelector } from 'src/fiatconnect/selectors'
import i18n from 'src/i18n'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import {
  useConvertBetweenCurrencies,
  useCurrencyToLocalAmount,
  useLocalAmountToCurrency,
  useLocalCurrencyCode,
} from 'src/localCurrency/hooks'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
import { roundDown, roundUp } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { CICOFlow } from './utils'

const TAG = 'FiatExchangeAmount'

const { decimalSeparator } = getNumberFormatSettings()

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeAmount>

type Props = RouteProps

const oneUnitAmount = (currency: Currency) => ({
  value: new BigNumber('1'),
  currencyCode: currency,
})

function FiatExchangeAmount({ route }: Props) {
  const { t } = useTranslation()
  const { currency, flow } = route.params

  const [showingInvalidAmountDialog, setShowingInvalidAmountDialog] = useState(false)
  const closeInvalidAmountDialog = () => {
    setShowingInvalidAmountDialog(false)
  }
  const [showingDailyLimitDialog, setShowingDailyLimitDialog] = useState(false)

  const [inputAmount, setInputAmount] = useState('')
  const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)
  const inputConvertedToCrypto =
    useLocalAmountToCurrency(parsedInputAmount, currency) || new BigNumber(0)
  const inputConvertedToLocalCurrency =
    useCurrencyToLocalAmount(parsedInputAmount, currency) || new BigNumber(0)
  const localCurrencyCode = useLocalCurrencyCode()
  const dailyLimitCusd = useSelector(cUsdDailyLimitSelector)
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)
  const cachedFiatAccounts = useSelector(cachedFiatAccountsSelector)!

  const cryptoSymbol = currency === Currency.Celo ? 'CELO' : currency
  const localCurrencySymbol = LocalCurrencySymbol[localCurrencyCode]

  const inputIsCrypto = flow === CICOFlow.CashOut || currency === Currency.Celo

  const inputCryptoAmount = inputIsCrypto ? parsedInputAmount : inputConvertedToCrypto
  const inputLocalCurrencyAmount = inputIsCrypto ? inputConvertedToLocalCurrency : parsedInputAmount

  const { address } = useTokenInfoBySymbol(cryptoSymbol)!
  const maxWithdrawAmount = useMaxSendAmount(address, FeeType.SEND)

  const inputSymbol = inputIsCrypto ? '' : localCurrencySymbol

  const displayCurrencyKey =
    currency === Currency.Celo
      ? 'subtotal'
      : currency === Currency.Dollar
      ? 'celoDollar'
      : 'celoEuro'

  const localCurrencyMaxAmount =
    useCurrencyToLocalAmount(new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT), Currency.Dollar) ||
    new BigNumber(0)

  const localCurrencyDailyLimitAmount =
    useCurrencyToLocalAmount(new BigNumber(dailyLimitCusd), Currency.Dollar) || new BigNumber(0)

  const currencyMaxAmount =
    useConvertBetweenCurrencies(
      new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT),
      Currency.Dollar,
      currency
    ) || new BigNumber(0)

  let overLocalLimitDisplayString = ''
  if (localCurrencyCode !== LocalCurrencyCode.USD) {
    overLocalLimitDisplayString =
      currency === Currency.Celo
        ? ` (${roundUp(currencyMaxAmount, 3)} CELO)`
        : ` (${localCurrencySymbol}${roundUp(localCurrencyMaxAmount)})`
  }

  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(fetchExchangeRate())
  }, [])

  const tokenInfo = useTokenInfoBySymbol(currency === Currency.Celo ? 'CELO' : currency)
  if (!tokenInfo) {
    Logger.error(TAG, "Couldn't grab the exchange token info")
    return null
  }

  function isNextButtonValid() {
    return parsedInputAmount.isGreaterThan(0)
  }

  function onChangeExchangeAmount(amount: string) {
    setInputAmount(amount.replace(localCurrencySymbol, ''))
  }

  function goToProvidersScreen() {
    ValoraAnalytics.track(FiatExchangeEvents.cico_amount_chosen, {
      amount: inputCryptoAmount.toNumber(),
      currency,
      flow,
    })
    const cryptoAmount = inputCryptoAmount.toNumber()
    // Rounding up to avoid decimal errors from providers. Won't be
    // necessary once we support inputting an amount in both crypto and fiat
    const fiatAmount = Math.round(inputLocalCurrencyAmount.toNumber())

    // Navigate straight to the review screen if the user has a FiatConnect fiat account saved
    // and the flow is supported

    if (cachedFiatAccounts?.length && cachedFiatAccounts[0].supportedFlows.includes(flow)) {
      const { providerId, fiatAccountId, fiatAccountType } = cachedFiatAccounts[0]
      navigate(Screens.FiatConnectReviewFetch, {
        flow,
        selectedCrypto: currency,
        cryptoAmount,
        fiatAmount,
        providerId,
        fiatAccountId,
        fiatAccountType,
      })
    } else {
      navigate(Screens.SelectProvider, {
        flow,
        selectedCrypto: currency,
        amount: {
          crypto: cryptoAmount,
          fiat: fiatAmount,
        },
      })
    }
  }

  function onPressContinue() {
    if (flow === CICOFlow.CashIn) {
      if (inputLocalCurrencyAmount.isGreaterThan(localCurrencyMaxAmount)) {
        setShowingInvalidAmountDialog(true)
        ValoraAnalytics.track(FiatExchangeEvents.cico_amount_chosen_invalid, {
          amount: inputCryptoAmount.toNumber(),
          currency,
          flow,
        })
        return
      }
      if (
        currency !== Currency.Celo &&
        inputLocalCurrencyAmount.isGreaterThan(localCurrencyDailyLimitAmount)
      ) {
        setShowingDailyLimitDialog(true)
        return
      }
    } else if (maxWithdrawAmount.isLessThan(inputCryptoAmount)) {
      dispatch(
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, ALERT_BANNER_DURATION, {
          balance: maxWithdrawAmount.toFixed(2),
          currency: cryptoSymbol,
        })
      )
      return
    }

    goToProvidersScreen()
  }

  const closeDailyLimitDialogAndContinue = () => {
    setShowingDailyLimitDialog(false)
    goToProvidersScreen()
  }

  const closeDailyLimitDialogAndContact = () => {
    setShowingDailyLimitDialog(false)
    navigate(Screens.SupportContact, { prefilledText: t('dailyLimitRequest') })
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Dialog
        isVisible={showingInvalidAmountDialog}
        actionText={t('invalidAmountDialog.dismiss')}
        actionPress={closeInvalidAmountDialog}
        isActionHighlighted={false}
        onBackgroundPress={closeInvalidAmountDialog}
        testID={'invalidAmountDialog'}
      >
        {t('invalidAmountDialog.maxAmount', {
          usdLimit: `$${DOLLAR_ADD_FUNDS_MAX_AMOUNT}`,
          localLimit: overLocalLimitDisplayString,
        })}
      </Dialog>
      <Dialog
        isVisible={showingDailyLimitDialog}
        actionText={t('dailyLimitDialog.continue')}
        actionPress={closeDailyLimitDialogAndContinue}
        secondaryActionDisabled={false}
        secondaryActionText={t('dailyLimitDialog.contact')}
        secondaryActionPress={closeDailyLimitDialogAndContact}
        testID={'DailyLimitDialog'}
      >
        {
          <Trans
            i18nKey={'dailyLimitDialog.body'}
            tOptions={{
              limit: `${localCurrencySymbol}${roundDown(localCurrencyDailyLimitAmount)}`,
              contactEmail: CELO_SUPPORT_EMAIL_ADDRESS,
            }}
          >
            <Text style={styles.emailLink} />
          </Trans>
        }
      </Dialog>
      <DisconnectBanner />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.amountInputContainer}>
          <View>
            <Text style={styles.exchangeBodyText}>
              {inputIsCrypto ? `${t('amount')} (${cryptoSymbol})` : t('amount')}
            </Text>
          </View>
          <TextInput
            multiline={true}
            autoFocus={true}
            keyboardType={'decimal-pad'}
            onChangeText={onChangeExchangeAmount}
            value={inputAmount.length > 0 ? `${inputSymbol}${inputAmount}` : undefined}
            placeholderTextColor={colors.gray3}
            placeholder={`${inputSymbol}0`}
            style={[styles.currencyInput, styles.fiatCurrencyColor]}
            testID="FiatExchangeInput"
          />
        </View>
        <LineItemRow
          testID="subtotal"
          textStyle={styles.subtotalBodyText}
          title={
            <Trans>
              {`${t(displayCurrencyKey)} @ `}
              <CurrencyDisplay amount={oneUnitAmount(currency)} showLocalAmount={true} />
            </Trans>
          }
          amount={
            inputIsCrypto ? (
              <CurrencyDisplay
                amount={{ value: inputCryptoAmount, currencyCode: currency }}
                showLocalAmount={true}
              />
            ) : (
              <TokenDisplay
                amount={inputCryptoAmount}
                tokenAddress={tokenInfo.address}
                showLocalAmount={false}
                hideSign={false}
              />
            )
          }
        />
      </KeyboardAwareScrollView>
      {currency !== Currency.Celo && (
        <Text style={styles.disclaimerFiat}>
          {t('disclaimerFiat', { currency: t(displayCurrencyKey) })}
        </Text>
      )}
      <Button
        onPress={onPressContinue}
        showLoading={exchangeRates[Currency.Dollar] === null}
        text={t('next')}
        type={BtnTypes.PRIMARY}
        accessibilityLabel={t('next')}
        disabled={!isNextButtonValid()}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        testID="FiatExchangeNextButton"
      />
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

FiatExchangeAmount.navOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeAmount>
}) => {
  const { currency, flow } = route.params
  const inputIsCrypto = flow === CICOFlow.CashOut || currency === Currency.Celo
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={FiatExchangeEvents.cico_amount_back} />,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t(
          route.params.flow === CICOFlow.CashIn
            ? `fiatExchangeFlow.cashIn.exchangeAmountTitle`
            : `fiatExchangeFlow.cashOut.exchangeAmountTitle`,
          {
            currency: route.params.currency === Currency.Celo ? 'CELO' : route.params.currency,
          }
        )}
        token={currency}
        displayCrypto={inputIsCrypto}
      />
    ),
  }
}

export default FiatExchangeAmount

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
    marginTop: 24,
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  exchangeBodyText: {
    ...fontStyles.regular500,
  },
  subtotalBodyText: {
    ...fontStyles.small,
  },
  currencyInput: {
    ...fontStyles.regular,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
    fontSize: 19,
    lineHeight: Platform.select({ android: 27, ios: 23 }), // vertical align = center
    minHeight: 48, // setting height manually b.c. of bug causing text to jump on Android
  },
  fiatCurrencyColor: {
    color: colors.greenUI,
  },
  emailLink: {
    color: colors.greenUI,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
  disclaimerFiat: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
  },
})
