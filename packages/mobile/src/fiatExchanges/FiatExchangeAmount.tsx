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
import BackButton from 'src/components/BackButton'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import LineItemRow from 'src/components/LineItemRow'
import { CELO_SUPPORT_EMAIL_ADDRESS, DOLLAR_ADD_FUNDS_MIN_AMOUNT } from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import { ExchangeRatePair, exchangeRatePairSelector } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import {
  convertDollarsToLocalAmount,
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, goldToDollarAmount } from 'src/utils/currencyExchange'

const { decimalSeparator } = getNumberFormatSettings()

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeAmount>

type Props = RouteProps

const oneDollarAmount = {
  value: new BigNumber('1'),
  currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
}

const oneCeloAmount = {
  value: new BigNumber('1'),
  currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
}

const useDollarAmount = (
  currency: CURRENCY_ENUM,
  amount: BigNumber,
  localExchangeRate: string | null | undefined,
  localCurrencyCode: LocalCurrencyCode,
  exchangeRatePair: ExchangeRatePair | null
) => {
  if (currency === CURRENCY_ENUM.DOLLAR) {
    const localAmount = amount.isNaN() ? new BigNumber(0) : amount
    const dollarAmount = convertLocalAmountToDollars(
      localAmount,
      localCurrencyCode ? localExchangeRate : 1
    )
    return convertDollarsToMaxSupportedPrecision(dollarAmount ?? new BigNumber('0'))
  } else {
    const exchangeRate = getRateForMakerToken(
      exchangeRatePair,
      CURRENCY_ENUM.DOLLAR,
      CURRENCY_ENUM.GOLD
    )
    return goldToDollarAmount(amount, exchangeRate) || new BigNumber(0)
  }
}

function FiatExchangeAmount({ route }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const [showingMinAmountDialog, setShowingMinAmountDialog] = useState(false)
  const closeMinAmountDialog = () => setShowingMinAmountDialog(false)
  const [showingDailyLimitDialog, setShowingDailyLimitDialog] = useState(false)

  const [inputAmount, setInputAmount] = useState('')
  const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)
  const exchangeRatePair = useSelector(exchangeRatePairSelector)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localCurrencyCode = useLocalCurrencyCode()
  const currencySymbol = LocalCurrencySymbol[localCurrencyCode]

  const { currency } = route.params
  const isCusdCashIn = currency === CURRENCY_ENUM.DOLLAR
  const inputCurrencySymbol = isCusdCashIn ? currencySymbol : ''

  const dollarAmount = useDollarAmount(
    currency,
    parsedInputAmount,
    localCurrencyExchangeRate,
    localCurrencyCode,
    exchangeRatePair
  )
  const localCurrencyAmount = convertDollarsToLocalAmount(dollarAmount, localCurrencyExchangeRate)
  const dailyLimitCusd = useSelector(cUsdDailyLimitSelector)
  const minAmountInLocalCurrency = convertDollarsToLocalAmount(
    DOLLAR_ADD_FUNDS_MIN_AMOUNT,
    localCurrencyExchangeRate
  )?.toFixed(0)

  const exchangeRateDisplay = getRateForMakerToken(
    exchangeRatePair,
    CURRENCY_ENUM.GOLD,
    CURRENCY_ENUM.DOLLAR
  )

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
    navigate(Screens.ProviderOptionsScreen, {
      isCashIn: true,
      currency: route.params.currency,
      amount: localCurrencyAmount?.toNumber() || 0,
    })
  }

  function onPressContinue() {
    if (dollarAmount.isLessThan(DOLLAR_ADD_FUNDS_MIN_AMOUNT)) {
      setShowingMinAmountDialog(true)
      return
    }
    if (dollarAmount.isGreaterThan(dailyLimitCusd)) {
      setShowingDailyLimitDialog(true)
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
        isVisible={showingMinAmountDialog}
        actionText={t('minAmountDialog.dismiss')}
        actionPress={closeMinAmountDialog}
        testID={'MinAmountDialog'}
      >
        {t('minAmountDialog.body', { limit: `${currencySymbol}${minAmountInLocalCurrency}` })}
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
            <Text style={styles.exchangeBodyText}>
              {isCusdCashIn ? t('global:amount') : t('amountCelo')}
            </Text>
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
              isCusdCashIn ? styles.dollarCurrencyColor : styles.celoCurrencyColor,
            ]}
            testID="FiatExchangeInput"
          />
        </View>
        <LineItemRow
          textStyle={styles.subtotalBodyText}
          title={
            <Trans
              i18nKey={isCusdCashIn ? 'celoDollarsAt' : 'inputSubtotal'}
              ns={Namespaces.fiatExchangeFlow}
            >
              {isCusdCashIn ? 'Celo Dollars @ ' : 'Subtotal @ '}
              <CurrencyDisplay
                amount={isCusdCashIn ? oneDollarAmount : oneCeloAmount}
                showLocalAmount={true}
              />
            </Trans>
          }
          amount={
            <CurrencyDisplay
              amount={{
                value: dollarAmount,
                currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
              }}
              hideSymbol={isCusdCashIn}
              showLocalAmount={!isCusdCashIn}
            />
          }
        />
      </KeyboardAwareScrollView>
      {isCusdCashIn && (
        <Text style={styles.disclaimerCeloDollars}>{t('disclaimerCeloDollars')}</Text>
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
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t('fiatExchangeFlow:addFunds')}
        token={route.params.currency}
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
  dollarCurrencyColor: {
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
  disclaimerCeloDollars: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
  },
  dollarsNotYetEnabledNote: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
})
