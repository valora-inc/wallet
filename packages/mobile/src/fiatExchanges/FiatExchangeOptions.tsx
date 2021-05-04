import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import RadioButton from '@celo/react-components/icons/RadioButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { RouteProp } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import FundingEducationDialog from 'src/fiatExchanges/FundingEducationDialog'
import {
  fetchLocalCicoProviders,
  getAvailableLocalProviders,
  LocalCicoProvider,
} from 'src/fiatExchanges/utils'
import i18n, { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeOptions>
type Props = RouteProps

export enum PaymentMethod {
  Card = 'Card',
  Bank = 'Bank',
  Exchange = 'Exchange',
  Address = 'Address',
  LocalProvider = 'LocalProvider',
  GiftCard = 'GiftCard',
}

export const fiatExchangesOptionsScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeOptions>
}) => {
  const eventName = route.params?.isCashIn
    ? FiatExchangeEvents.cico_add_funds_back
    : FiatExchangeEvents.cico_cash_out_back

  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={eventName} />,
    headerTitle: i18n.t(`fiatExchangeFlow:${route.params?.isCashIn ? 'addFunds' : 'cashOut'}`),
    headerRightContainerStyle: { paddingRight: 16 },
  }
}

const currencyBorderColor = (selected: boolean) => (selected ? colors.greenUI : colors.gray3)

function CurrencyRadioItem({
  selected,
  onSelect,
  enabled = true,
  title,
  body,
  containerStyle,
}: {
  selected: boolean
  onSelect: () => void
  enabled?: boolean
  title: string
  body?: string
  containerStyle: ViewStyle
}) {
  return (
    <TouchableWithoutFeedback onPress={onSelect} disabled={!enabled}>
      <View
        style={[
          styles.currencyItemContainer,
          containerStyle,
          { borderColor: currencyBorderColor(selected) },
        ]}
      >
        <RadioButton selected={selected} disabled={!enabled} />
        <Text style={[styles.currencyItemTitle, enabled ? {} : { color: colors.gray3 }]}>
          {title}
        </Text>
        {body && <Text style={styles.currencyItemBody}>{body}</Text>}
      </View>
    </TouchableWithoutFeedback>
  )
}

function PaymentMethodRadioItem({
  selected,
  onSelect,
  text,
  enabled = true,
}: {
  selected: boolean
  onSelect: () => void
  text: string
  enabled?: boolean
}): JSX.Element {
  return (
    <TouchableWithoutFeedback onPress={onSelect} disabled={!enabled}>
      <View style={styles.paymentMethodItemContainer}>
        <RadioButton selected={selected} disabled={!enabled} />
        <Text style={[styles.paymentMethodItemText, enabled ? {} : { color: colors.gray3 }]}>
          {text}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  )
}

function FiatExchangeOptions({ route, navigation }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const isCashIn = route.params?.isCashIn ?? true
  const countryCode = useSelector(defaultCountryCodeSelector)

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.Dollar)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    isCashIn ? PaymentMethod.Card : PaymentMethod.Exchange
  )
  const [selectedLocalProvider, setSelectedLocalProvider] = useState<LocalCicoProvider>()
  const [isEducationDialogVisible, setEducationDialogVisible] = useState(false)

  const asset = selectedCurrency === Currency.Dollar ? 'cusd' : 'celo'
  const flow = isCashIn ? 'cashIn' : 'cashOut'

  const goToProvider = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_option_chosen, {
      isCashIn,
      paymentMethod: selectedPaymentMethod,
      currency: selectedCurrency,
    })
    if (selectedPaymentMethod === PaymentMethod.Exchange) {
      navigate(Screens.ExternalExchanges, {
        currency: selectedCurrency,
      })
    } else if (selectedPaymentMethod === PaymentMethod.LocalProvider && selectedLocalProvider) {
      navigateToURI(selectedLocalProvider[asset].url)
      navigateHome()
    } else if (selectedPaymentMethod === PaymentMethod.GiftCard) {
      navigate(Screens.BidaliScreen, { currency: selectedCurrency })
    } else if (selectedPaymentMethod === PaymentMethod.Address) {
      navigate(Screens.WithdrawCeloScreen, { isCashOut: true })
    } else if (
      selectedPaymentMethod === PaymentMethod.Bank ||
      selectedPaymentMethod === PaymentMethod.Card
    ) {
      navigate(Screens.FiatExchangeAmount, {
        currency: selectedCurrency,
        paymentMethod: selectedPaymentMethod,
        isCashIn,
      })
    }
  }

  const onSelectCurrency = (currency: Currency) => () => setSelectedCurrency(currency)

  const onSelectPaymentMethod = (
    paymentMethod: PaymentMethod,
    localProvider?: LocalCicoProvider
  ) => () => {
    setSelectedPaymentMethod(paymentMethod)
    setSelectedLocalProvider(localProvider)
  }

  const onPressInfoIcon = () => {
    setEducationDialogVisible(true)
    ValoraAnalytics.track(
      isCashIn ? FiatExchangeEvents.cico_add_funds_info : FiatExchangeEvents.cico_cash_out_info
    )
  }

  const onPressDismissEducationDialog = () => {
    setEducationDialogVisible(false)
    ValoraAnalytics.track(
      isCashIn
        ? FiatExchangeEvents.cico_add_funds_info_cancel
        : FiatExchangeEvents.cico_cash_out_info_cancel
    )
  }

  const asyncLocalCicoProviders = useAsync(fetchLocalCicoProviders, [])
  const localCicoProviders = asyncLocalCicoProviders.result

  return (
    <SafeAreaView style={styles.content}>
      <ScrollView style={styles.topContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.selectDigitalCurrency}>{t('selectDigitalCurrency')}</Text>
          <Touchable onPress={onPressInfoIcon} hitSlop={variables.iconHitslop}>
            <InfoIcon size={14} color={colors.gray3} />
          </Touchable>
        </View>
        <View style={styles.currenciesContainer}>
          <CurrencyRadioItem
            title={t('celoDollar')}
            body="(cUSD)"
            selected={selectedCurrency === Currency.Dollar}
            onSelect={onSelectCurrency(Currency.Dollar)}
            containerStyle={{
              borderBottomWidth: 0,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
            enabled={selectedPaymentMethod !== PaymentMethod.Address}
          />
          <View style={styles.currencySeparator} />
          <CurrencyRadioItem
            title="CELO"
            selected={selectedCurrency === Currency.Celo}
            onSelect={onSelectCurrency(Currency.Celo)}
            containerStyle={{
              borderTopWidth: 0,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
            enabled={selectedPaymentMethod !== PaymentMethod.GiftCard}
          />
        </View>
      </ScrollView>
      <View style={styles.bottomContainer}>
        <Text style={styles.selectPaymentMethod}>
          {t(isCashIn ? 'selectPaymentMethod' : 'selectCashOutMethod')}
        </Text>
        <View style={styles.paymentMethodsContainer}>
          {asyncLocalCicoProviders.loading ? (
            <ActivityIndicator style={styles.loading} size="small" color={colors.greenUI} />
          ) : (
            <>
              {isCashIn ? (
                <>
                  <PaymentMethodRadioItem
                    text={t('payWithCard')}
                    selected={selectedPaymentMethod === PaymentMethod.Card}
                    onSelect={onSelectPaymentMethod(PaymentMethod.Card)}
                  />
                  <PaymentMethodRadioItem
                    text={t('payWithBank')}
                    selected={selectedPaymentMethod === PaymentMethod.Bank}
                    onSelect={onSelectPaymentMethod(PaymentMethod.Bank)}
                  />
                </>
              ) : (
                <>
                  <PaymentMethodRadioItem
                    text={t('payWithBank')}
                    selected={selectedPaymentMethod === PaymentMethod.Bank}
                    onSelect={onSelectPaymentMethod(PaymentMethod.Bank)}
                  />
                  <PaymentMethodRadioItem
                    text={t('receiveOnAddress')}
                    selected={selectedPaymentMethod === PaymentMethod.Address}
                    onSelect={onSelectPaymentMethod(PaymentMethod.Address)}
                    enabled={selectedCurrency === Currency.Celo}
                  />
                  <PaymentMethodRadioItem
                    text={t('receiveWithBidali')}
                    selected={selectedPaymentMethod === PaymentMethod.GiftCard}
                    onSelect={onSelectPaymentMethod(PaymentMethod.GiftCard)}
                    enabled={selectedCurrency === Currency.Dollar}
                  />
                </>
              )}
              <PaymentMethodRadioItem
                text={t('payWithExchange')}
                selected={selectedPaymentMethod === PaymentMethod.Exchange}
                onSelect={onSelectPaymentMethod(PaymentMethod.Exchange)}
              />
              {getAvailableLocalProviders(
                localCicoProviders,
                isCashIn,
                countryCode,
                selectedCurrency
              ).map((provider) => (
                <PaymentMethodRadioItem
                  key={provider.name}
                  text={provider.name}
                  selected={selectedLocalProvider?.name === provider.name}
                  onSelect={onSelectPaymentMethod(PaymentMethod.LocalProvider, provider)}
                  enabled={provider[asset][flow]}
                />
              ))}
            </>
          )}
        </View>
        <Button
          style={styles.goToProvider}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          text={t('global:next')}
          onPress={goToProvider}
          testID={'GoToProviderButton'}
        />
      </View>
      <FundingEducationDialog
        isVisible={isEducationDialogVisible}
        onPressDismiss={onPressDismissEducationDialog}
        isCashIn={isCashIn}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: colors.gray1,
  },
  topContainer: {
    paddingHorizontal: variables.contentPadding,
    backgroundColor: colors.light,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: variables.contentPadding,
  },
  selectDigitalCurrency: {
    ...fontStyles.regular,
    marginRight: 12,
  },
  currenciesContainer: {
    flexDirection: 'column',
    marginTop: 8,
  },
  currencyItemContainer: {
    flexDirection: 'row',
    padding: variables.contentPadding,
    borderWidth: 1,
  },
  currencyItemTitle: {
    ...fontStyles.regular500,
    marginLeft: variables.contentPadding,
  },
  currencyItemBody: {
    ...fontStyles.regular500,
    color: colors.gray4,
    marginLeft: 4,
  },
  currencySeparator: {
    height: 1,
    backgroundColor: colors.greenUI,
  },
  bottomContainer: {
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
  },
  selectPaymentMethod: {
    ...fontStyles.small500,
    marginTop: variables.contentPadding,
  },
  paymentMethodsContainer: {
    flexDirection: 'column',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 8,
    minHeight: 100,
  },
  paymentMethodItemContainer: {
    flexDirection: 'row',
    padding: 8,
  },
  paymentMethodItemText: {
    ...fontStyles.small,
    marginLeft: 8,
  },
  goToProvider: {
    width: '50%',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
})

export default FiatExchangeOptions
