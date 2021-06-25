// Need to do the input check to ensure that it's above the min and below the max cash-in amounts
// Also need to make sure that the amount.crypto and amount.fiat nav params are correct
// Then need to make sure the backend can handle a new base currnecy request (i.e., only show Ramp for cEUR)

import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
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
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import LineItemRow from 'src/components/LineItemRow'
import {
  ALERT_BANNER_DURATION,
  CELO_SUPPORT_EMAIL_ADDRESS,
  DOLLAR_ADD_FUNDS_MAX_AMOUNT,
  DOLLAR_ADD_FUNDS_MIN_AMOUNT,
} from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import { ExchangeRatePair, exchangeRatePairSelector } from 'src/exchange/reducer'
import i18n, { Namespaces } from 'src/i18n'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import {
  convertLocalAmountToDollars,
  convertToMaxSupportedPrecision,
} from 'src/localCurrency/convert'
import { useCurrencyToLocalAmount, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import {
  getLocalCurrencyToDollarsExchangeRate,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance, HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { Balances, balancesSelector } from 'src/stableToken/selectors'
import { Currency } from 'src/utils/currencies'
import { getRateForMakerToken, goldToDollarAmount } from 'src/utils/currencyExchange'
import Logger from 'src/utils/Logger'

const { decimalSeparator } = getNumberFormatSettings()

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeAmount>

type Props = RouteProps

const oneUnitAmount = (currency: Currency) => ({
  value: new BigNumber('1'),
  currencyCode: currency,
})

const useDollarAmount = (
  currency: Currency,
  amount: BigNumber,
  localExchangeRate: string | null | undefined,
  localCurrencyCode: LocalCurrencyCode,
  exchangeRatePair: ExchangeRatePair | null
) => {
  if (currency === Currency.Dollar) {
    const localAmount = amount.isNaN() ? new BigNumber(0) : amount
    const dollarAmount = convertLocalAmountToDollars(
      localAmount,
      localCurrencyCode ? localExchangeRate : 1
    )
    return convertToMaxSupportedPrecision(dollarAmount ?? new BigNumber('0'))
  } else {
    const exchangeRate = getRateForMakerToken(exchangeRatePair, Currency.Dollar, Currency.Celo)
    return goldToDollarAmount(amount, exchangeRate) || new BigNumber(0)
  }
}

const balanceIsSufficient = (currency: Currency, inputAmount: BigNumber, balances: Balances) =>
  inputAmount.isLessThan(balances[currency] || new BigNumber(0))

function FiatExchangeAmount({ route }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const [showingInvalidAmountDialog, setShowingInvalidAmountDialog] = useState(false)
  const closeInvalidAmountDialog = () => {
    setShowingInvalidAmountDialog(false)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_amount_dialog_cancel)
  }
  const [showingDailyLimitDialog, setShowingDailyLimitDialog] = useState(false)

  const [inputAmount, setInputAmount] = useState('')
  const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)
  const exchangeRatePair = useSelector(exchangeRatePairSelector)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyToDollarsExchangeRate)
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)

  const balances = useSelector(balancesSelector)

  const localCurrencyCode = useLocalCurrencyCode()
  const currencySymbol = LocalCurrencySymbol[localCurrencyCode]

  const { currency } = route.params
  const isStablecoin = currency !== Currency.Celo
  const inputCurrencySymbol =
    currency === Currency.Celo
      ? ''
      : currency === Currency.Dollar
      ? LocalCurrencySymbol.USD
      : LocalCurrencySymbol.EUR

  const displayCurrencyKey =
    currency === Currency.Celo ? 'Celo' : currency === Currency.Dollar ? 'celoDollar' : 'celoEuro'

  const dollarAmount = useDollarAmount(
    currency,
    parsedInputAmount,
    localCurrencyExchangeRate,
    localCurrencyCode,
    exchangeRatePair
  )

  const dollarAmount = useCurrencyToLocalAmount
  const localCurrencyAmount = useCurrencyToLocalAmount(parsedInputAmount, currency)

  const dailyLimitCusd = useSelector(cUsdDailyLimitSelector)
  const minAmountInLocalCurrency = useCurrencyToLocalAmount(
    new BigNumber(DOLLAR_ADD_FUNDS_MIN_AMOUNT),
    currency
  )?.toFixed(0)
  const maxAmountInLocalCurrency = useCurrencyToLocalAmount(
    new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT),
    currency
  )?.toFixed(0)

  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(fetchExchangeRate())
  }, [])

  function isNextButtonValid() {
    return dollarAmount.isGreaterThan(0)
  }

  function onChangeExchangeAmount(amount: string) {
    setInputAmount(amount.replace(inputCurrencySymbol, ''))
  }

  function goToProvidersScreen() {
    const selectedCrypto = route.params.currency
    const { isCashIn } = route.params
    navigate(Screens.ProviderOptionsScreen, {
      isCashIn,
      selectedCrypto,
      amount: {
        crypto:
          selectedCrypto === Currency.Celo ? parsedInputAmount.toNumber() : dollarAmount.toNumber(),
        // Rounding up to avoid decimal errors from providers. Won't be
        // necessary once we support inputting an amount in both crypto and fiat
        fiat: Math.round(localCurrencyAmount?.toNumber() || 0),
      },
      paymentMethod: route.params.paymentMethod,
    })
  }

  function onPressContinue() {
    if (!route.params.isCashIn && currency === Currency.Celo) {
      Logger.debug(
        'Error: Got to FiatExchangeAmountScreen with CELO as the cash-out asset - should never happen'
      )
      return
    }

    if (route.params.isCashIn) {
      if (
        dollarAmount.isLessThan(DOLLAR_ADD_FUNDS_MIN_AMOUNT) ||
        dollarAmount.isGreaterThan(DOLLAR_ADD_FUNDS_MAX_AMOUNT)
      ) {
        setShowingInvalidAmountDialog(true)
        ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_invalid_amount, {
          dollarAmount,
        })
        return
      }
      if (dollarAmount.isGreaterThan(dailyLimitCusd)) {
        setShowingDailyLimitDialog(true)
        return
      }

      ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_amount_continue, {
        dollarAmount,
      })
    } else if (!balanceIsSufficient(currency, parsedInputAmount, balances)) {
      const localBalance = balances[currency] || new BigNumber(0)
      dispatch(
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, ALERT_BANNER_DURATION, {
          balance: localBalance.toFixed(2),
          currency: localCurrencyCode,
        })
      )
      return
    }

    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_amount_continue, {
      dollarAmount,
    })
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
        testID={'invalidAmountDialog'}
      >
        {dollarAmount.isLessThan(DOLLAR_ADD_FUNDS_MIN_AMOUNT)
          ? t('invalidAmountDialog.minAmount', {
              limit: `${currencySymbol}${minAmountInLocalCurrency}`,
            })
          : t('invalidAmountDialog.maxAmount', {
              limit: `${currencySymbol}${maxAmountInLocalCurrency}`,
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
            ns={Namespaces.fiatExchangeFlow}
            tOptions={{ limit: `${dailyLimitCusd} cUSD`, contactEmail: CELO_SUPPORT_EMAIL_ADDRESS }}
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
            <Text style={styles.exchangeBodyText}>{`${t('global:amount')} (${
              currency === Currency.Celo ? 'CELO' : currency
            })`}</Text>
          </View>
          <TextInput
            autoFocus={true}
            keyboardType={'decimal-pad'}
            onChangeText={onChangeExchangeAmount}
            value={inputAmount.length > 0 ? `${inputCurrencySymbol}${inputAmount}` : undefined}
            placeholderTextColor={colors.gray3}
            placeholder={`${inputCurrencySymbol}0`}
            style={[
              styles.currencyInput,
              isStablecoin ? styles.fiatCurrencyColor : styles.celoCurrencyColor,
            ]}
            testID="FiatExchangeInput"
          />
        </View>
        <LineItemRow
          textStyle={styles.subtotalBodyText}
          title={
            <Trans>
              {`${t(displayCurrencyKey)} @ `}
              <CurrencyDisplay amount={oneUnitAmount(currency)} showLocalAmount={true} />
            </Trans>
          }
          amount={
            <CurrencyDisplay
              amount={{
                value: inputAmount,
                currencyCode: currency,
              }}
              showLocalAmount={true}
            />
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
        showLoading={exchangeRatePair === null}
        text={t('global:next')}
        type={BtnTypes.PRIMARY}
        accessibilityLabel={t('global:next')}
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
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={FiatExchangeEvents.cico_add_funds_amount_back} />,
  headerTitle: () =>
    route.params?.isCashIn ? (
      <HeaderTitleWithSubtitle title={i18n.t('fiatExchangeFlow:addFunds')} />
    ) : (
      <HeaderTitleWithBalance
        title={i18n.t('fiatExchangeFlow:cashOut')}
        token={route.params.currency}
      />
    ),
})

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
    height: 48, // setting height manually b.c. of bug causing text to jump on Android
  },
  fiatCurrencyColor: {
    color: colors.greenUI,
  },
  celoCurrencyColor: {
    color: colors.goldDark,
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
