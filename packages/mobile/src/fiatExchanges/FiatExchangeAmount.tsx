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
import i18n, { Namespaces } from 'src/i18n'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import {
  useConvertBetweenCurrencies,
  useCurrencyToLocalAmount,
  useLocalAmountToCurrency,
  useLocalCurrencyCode,
} from 'src/localCurrency/hooks'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance, HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { balancesSelector } from 'src/stableToken/selectors'
import { Currency } from 'src/utils/currencies'
import { roundDown, roundUp } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

const { decimalSeparator } = getNumberFormatSettings()

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeAmount>

type Props = RouteProps

const oneUnitAmount = (currency: Currency) => ({
  value: new BigNumber('1'),
  currencyCode: currency,
})

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
  const localCurrencyCode = useLocalCurrencyCode()

  const { currency } = route.params

  const localCurrencySymbol = LocalCurrencySymbol[localCurrencyCode]
  const displaySymbol = currency === Currency.Celo ? '' : localCurrencySymbol

  const displayCurrencyKey =
    currency === Currency.Celo
      ? 'global:subtotal'
      : currency === Currency.Dollar
      ? 'celoDollar'
      : 'celoEuro'

  const balances = useSelector(balancesSelector)
  const dailyLimitCusd = useSelector(cUsdDailyLimitSelector)
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)
  const currencyBalance = balances[currency] || new BigNumber(0)

  const localAmountToCurrency =
    useLocalAmountToCurrency(parsedInputAmount, currency) || new BigNumber(0)

  const currencyToLocalAmount =
    useCurrencyToLocalAmount(parsedInputAmount, currency) || new BigNumber(0)

  const currencyAmountRequested =
    currency === Currency.Celo ? parsedInputAmount : localAmountToCurrency

  const localCurrencyAmountRequested =
    currency === Currency.Celo ? currencyToLocalAmount : parsedInputAmount

  const localCurrencyBalance =
    useCurrencyToLocalAmount(currencyBalance, currency) || new BigNumber(0)

  const localCurrencyMaxAmount =
    useCurrencyToLocalAmount(new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT), Currency.Dollar) ||
    new BigNumber(0)

  const localCurrencyMinAmount =
    useCurrencyToLocalAmount(new BigNumber(DOLLAR_ADD_FUNDS_MIN_AMOUNT), Currency.Dollar) ||
    new BigNumber(0)

  const localCurrencyDailyLimitAmount =
    useCurrencyToLocalAmount(new BigNumber(dailyLimitCusd), Currency.Dollar) || new BigNumber(0)

  const currencyMaxAmount =
    useConvertBetweenCurrencies(
      new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT),
      Currency.Dollar,
      currency
    ) || new BigNumber(0)

  const currencyMinAmount =
    useConvertBetweenCurrencies(
      new BigNumber(DOLLAR_ADD_FUNDS_MIN_AMOUNT),
      Currency.Dollar,
      currency
    ) || new BigNumber(0)

  let overLocalLimitDisplayString = ''
  let underLocalLimitDisplayString = ''
  if (localCurrencyCode !== LocalCurrencyCode.USD) {
    overLocalLimitDisplayString =
      currency === Currency.Celo
        ? ` (${roundUp(currencyMaxAmount, 3)} CELO)`
        : ` (${localCurrencySymbol}${roundUp(localCurrencyMaxAmount)})`

    underLocalLimitDisplayString =
      currency === Currency.Celo
        ? ` (${roundUp(currencyMinAmount, 3)} CELO)`
        : ` (${localCurrencySymbol}${roundUp(localCurrencyMinAmount)})`
  }

  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(fetchExchangeRate())
  }, [])

  function isNextButtonValid() {
    return parsedInputAmount.isGreaterThan(0)
  }

  function onChangeExchangeAmount(amount: string) {
    setInputAmount(amount.replace(localCurrencySymbol, ''))
  }

  function goToProvidersScreen() {
    const { isCashIn } = route.params

    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_amount_continue, {
      amount: currencyAmountRequested.toNumber(),
      currency,
      isCashIn,
    })

    navigate(Screens.ProviderOptionsScreen, {
      isCashIn,
      selectedCrypto: currency,
      amount: {
        crypto: currencyAmountRequested.toNumber(),
        // Rounding up to avoid decimal errors from providers. Won't be
        // necessary once we support inputting an amount in both crypto and fiat
        fiat: Math.round(localCurrencyAmountRequested.toNumber()),
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
        localCurrencyAmountRequested.isGreaterThan(localCurrencyMaxAmount) ||
        localCurrencyAmountRequested.isLessThan(localCurrencyMinAmount)
      ) {
        setShowingInvalidAmountDialog(true)
        ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_invalid_amount, {
          amount: currencyAmountRequested.toNumber(),
          currency,
        })
        return
      }
      if (
        currency !== Currency.Celo &&
        localCurrencyAmountRequested.isGreaterThan(localCurrencyDailyLimitAmount)
      ) {
        setShowingDailyLimitDialog(true)
        return
      }
    } else if (currencyBalance.isLessThan(currencyAmountRequested)) {
      dispatch(
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, ALERT_BANNER_DURATION, {
          balance: localCurrencyBalance.toFixed(2),
          currency: localCurrencyCode,
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
        testID={'invalidAmountDialog'}
      >
        {localCurrencyAmountRequested.isGreaterThan(localCurrencyMaxAmount)
          ? t('invalidAmountDialog.maxAmount', {
              usdLimit: `$${DOLLAR_ADD_FUNDS_MAX_AMOUNT}`,
              localLimit: overLocalLimitDisplayString,
            })
          : t('invalidAmountDialog.minAmount', {
              usdLimit: `$${DOLLAR_ADD_FUNDS_MIN_AMOUNT}`,
              localLimit: underLocalLimitDisplayString,
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
            <Text style={styles.exchangeBodyText}>{`${t('global:amount')} ${
              currency === Currency.Celo ? '(CELO)' : ''
            }`}</Text>
          </View>
          <TextInput
            multiline={true}
            autoFocus={true}
            keyboardType={'decimal-pad'}
            onChangeText={onChangeExchangeAmount}
            value={inputAmount.length > 0 ? `${displaySymbol}${inputAmount}` : undefined}
            placeholderTextColor={colors.gray3}
            placeholder={`${displaySymbol}0`}
            style={[
              styles.currencyInput,
              currency === Currency.Celo ? styles.celoCurrencyColor : styles.fiatCurrencyColor,
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
                value: currencyAmountRequested,
                currencyCode: currency,
              }}
              hideSymbol={currency !== Currency.Celo}
              showLocalAmount={currency === Currency.Celo}
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
        showLoading={exchangeRates[Currency.Dollar] === null}
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
