import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { RouteProp, useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import { CurrencyCode } from 'src/config'
import { selectProvider } from 'src/fiatExchanges/actions'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CicoProviderNames } from 'src/fiatExchanges/reducer'
import {
  fetchSimplexQuote,
  fetchUserLocationData,
  getProviderAvailability,
  sortProviders,
} from 'src/fiatExchanges/utils'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import QuestionIcon from 'src/icons/QuestionIcon'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = StackScreenProps<StackParamList, Screens.ProviderOptionsScreen>

ProviderOptionsScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ProviderOptionsScreen>
}) => {
  const eventName = route.params?.isCashIn
    ? FiatExchangeEvents.cico_add_funds_select_provider_back
    : FiatExchangeEvents.cico_cash_out_select_provider_back

  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={eventName} />,
    headerTitle: i18n.t(`fiatExchangeFlow:${route.params?.isCashIn ? 'addFunds' : 'cashOut'}`),
  }
}
export interface CicoProvider {
  id: CicoProviderNames
  restricted: boolean
  unavailable?: boolean
  paymentMethods: PaymentMethod[]
  image?: React.ReactNode
  onSelected: () => void
}

function ProviderOptionsScreen({ route, navigation }: Props) {
  const [showingExplanation, setShowExplanation] = useState(false)

  const onDismissExplanation = () => {
    setShowExplanation(false)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_select_provider_info_cancel)
  }
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const countryCallingCode = useSelector(defaultCountryCodeSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const isCashIn = route.params?.isCashIn ?? true

  const { paymentMethod } = route.params
  const currencyToBuy = {
    [CURRENCY_ENUM.GOLD]: CurrencyCode.CELO,
    [CURRENCY_ENUM.DOLLAR]: CurrencyCode.CUSD,
  }[route.params.selectedCrypto || CURRENCY_ENUM.DOLLAR]

  const dispatch = useDispatch()
  const isFocused = useIsFocused()

  useLayoutEffect(() => {
    const showExplanation = () => {
      setShowExplanation(true)
      ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_select_provider_info)
    }

    navigation.setOptions({
      headerRightContainerStyle: { paddingRight: 16 },
      headerRight: () => (
        <TopBarIconButton
          icon={<QuestionIcon color={colors.greenUI} />}
          onPress={showExplanation}
        />
      ),
    })
  }, [])

  const asyncUserLocation = useAsync(async () => fetchUserLocationData(countryCallingCode), [])
  const userLocation = asyncUserLocation.result

  const asyncProviderQuotes = useAsync(async () => {
    if (!account || !userLocation?.ipAddress) {
      return
    }

    const simplexQuote = await fetchSimplexQuote(
      account,
      userLocation.ipAddress,
      currencyToBuy,
      localCurrency,
      route.params.amount.crypto,
      false
    )

    return { simplexQuote }
  }, [userLocation?.ipAddress, isFocused])

  const providerQuotes = asyncProviderQuotes.result

  const {
    MOONPAY_RESTRICTED,
    SIMPLEX_RESTRICTED,
    RAMP_RESTRICTED,
    TRANSAK_RESTRICTED,
    XANPOOL_RESTRICTED,
  } = getProviderAvailability(userLocation)

  const providerWidgetInputs = {
    localAmount: route.params.amount.fiat,
    currencyCode: localCurrency,
    currencyToBuy,
  }

  const xanpool = {
    id: CicoProviderNames.Xanpool,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    restricted: XANPOOL_RESTRICTED,
    onSelected: () => navigate(Screens.XanpoolScreen, providerWidgetInputs),
  }

  const moonpay = {
    id: CicoProviderNames.Moonpay,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    restricted: MOONPAY_RESTRICTED,
    onSelected: () => navigate(Screens.MoonPayScreen, providerWidgetInputs),
  }

  const simplex = {
    id: CicoProviderNames.Simplex,
    paymentMethods: [PaymentMethod.Card],
    restricted: SIMPLEX_RESTRICTED,
    unavailable: !providerQuotes?.simplexQuote,
    onSelected: () => {
      if (providerQuotes?.simplexQuote && userLocation?.ipAddress) {
        navigate(Screens.Simplex, {
          simplexQuote: providerQuotes?.simplexQuote,
          userIpAddress: userLocation.ipAddress,
        })
      }
    },
  }

  const ramp = {
    id: CicoProviderNames.Ramp,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    restricted: RAMP_RESTRICTED,
    onSelected: () => navigate(Screens.RampScreen, providerWidgetInputs),
  }

  const transak = {
    id: CicoProviderNames.Transak,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    restricted: TRANSAK_RESTRICTED,
    onSelected: () => navigate(Screens.TransakScreen, providerWidgetInputs),
  }

  const providers: {
    cashOut: CicoProvider[]
    cashIn: CicoProvider[]
  } = {
    cashOut: [xanpool].sort(sortProviders),
    cashIn: [moonpay, simplex, xanpool, ramp, transak].sort(sortProviders),
  }

  const providerOnPress = (provider: CicoProvider) => () => {
    ValoraAnalytics.track(FiatExchangeEvents.provider_chosen, {
      isCashIn,
      provider: provider.id,
    })
    dispatch(selectProvider(provider.id))
    provider.onSelected()
  }

  return !userLocation || asyncProviderQuotes.status === 'loading' ? (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator size="large" color={colors.greenBrand} />
    </View>
  ) : (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.pleaseSelectProvider}>{t('pleaseSelectProvider')}</Text>
        <View style={styles.providersContainer}>
          {providers[isCashIn ? 'cashIn' : 'cashOut'].map((provider) => (
            <ListItem key={provider.id} onPress={providerOnPress(provider)}>
              <View style={styles.providerListItem} testID={`Provider/${provider.id}`}>
                <View style={styles.providerTextContainer}>
                  <Text
                    style={[
                      styles.optionTitle,
                      provider.unavailable ? { color: colors.gray4 } : null,
                    ]}
                  >
                    {provider.id}
                  </Text>
                  {provider.unavailable && (
                    <Text style={styles.restrictedText}>{t('providerUnavailable')}</Text>
                  )}
                  {provider.restricted && !provider.unavailable && (
                    <Text style={styles.restrictedText}>{t('restrictedRegion')}</Text>
                  )}
                  {!provider.restricted && !provider.paymentMethods.includes(paymentMethod) && (
                    <Text style={styles.restrictedText}>
                      {t('unsupportedPaymentMethod', {
                        paymentMethod:
                          paymentMethod === PaymentMethod.Bank
                            ? 'bank account'
                            : 'debit or credit card',
                      })}
                    </Text>
                  )}
                </View>
                <LinkArrow />
              </View>
            </ListItem>
          ))}
        </View>
        <Dialog
          title={t('explanationModal.title')}
          isVisible={showingExplanation}
          actionText={t('global:dismiss')}
          actionPress={onDismissExplanation}
        >
          {t('explanationModal.body')}
        </Dialog>
      </SafeAreaView>
    </ScrollView>
  )
}

export default ProviderOptionsScreen

const styles = StyleSheet.create({
  container: {
    paddingVertical: variables.contentPadding,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    marginRight: variables.contentPadding,
  },
  pleaseSelectProvider: {
    ...fontStyles.regular,
    marginBottom: variables.contentPadding,
    paddingLeft: variables.contentPadding,
  },
  logo: {
    height: 30,
  },
  provider: {
    marginVertical: 24,
  },
  providersContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
  },
  providerListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerTextContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  restrictedText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  optionTitle: {
    ...fontStyles.regular500,
  },
})
