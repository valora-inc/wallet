import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { RouteProp, useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import { CurrencyCode } from 'src/config'
import { selectProvider } from 'src/fiatExchanges/actions'
import Simplex from 'src/fiatExchanges/Simplex'
import {
  fetchUserLocationData,
  getProviderAvailability,
  sortProviders,
} from 'src/fiatExchanges/utils'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import QuestionIcon from 'src/icons/QuestionIcon'
import { moonpayLogo, simplexLogo } from 'src/images/Images'
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

export interface Provider {
  name: string
  restricted: boolean
  unavailable?: boolean
  icon: string
  image?: React.ReactNode
  isFeeDataLoading?: boolean
  onSelected: () => void
}

export enum Providers {
  MOONPAY = 'MOONPAY',
  RAMP = 'RAMP',
  TRANSAK = 'TRANSAK',
  SIMPLEX = 'SIMPLEX',
}

function ProviderOptionsScreen({ route, navigation }: Props) {
  const [showingExplanation, setShowExplanation] = useState(false)

  const onDismissExplanation = () => {
    setShowExplanation(false)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_select_provider_info_cancel)
  }
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const countryCallingCode = useSelector(defaultCountryCodeSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const account = useSelector(currentAccountSelector)
  const isCashIn = route.params?.isCashIn ?? true
  const selectedCurrency = {
    [CURRENCY_ENUM.GOLD]: CurrencyCode.CELO,
    [CURRENCY_ENUM.DOLLAR]: CurrencyCode.CUSD,
  }[route.params.currency || CURRENCY_ENUM.DOLLAR]

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

    const simplexQuote = await Simplex.fetchQuote(
      account,
      userLocation.ipAddress,
      selectedCurrency,
      localCurrency,
      route.params.amount
    )

    return { simplexQuote }
  }, [userLocation?.ipAddress, isFocused])

  const providerQuotes = asyncProviderQuotes.result

  const {
    MOONPAY_RESTRICTED,
    SIMPLEX_RESTRICTED,
    RAMP_RESTRICTED,
    TRANSAK_RESTRICTED,
  } = getProviderAvailability(userLocation)

  const providerWidgetInputs = {
    localAmount: route.params.amount,
    currencyCode: localCurrency,
    currencyToBuy: selectedCurrency,
  }

  const providers: {
    cashOut: Provider[]
    cashIn: Provider[]
  } = {
    cashOut: [],
    cashIn: [
      {
        name: 'Moonpay',
        restricted: MOONPAY_RESTRICTED,
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media&token=3617af49-7762-414d-a4d0-df05fbc49b97',
        image: <Image source={moonpayLogo} style={styles.logo} resizeMode={'contain'} />,
        onSelected: () => navigate(Screens.MoonPayScreen, providerWidgetInputs),
      },
      {
        name: 'Simplex',
        restricted: SIMPLEX_RESTRICTED,
        unavailable: !providerQuotes?.simplexQuote || !userLocation?.ipAddress,
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media&token=6037b2f9-9d76-4076-b29e-b7e0de0b3f34',
        image: <Image source={simplexLogo} style={styles.logo} resizeMode={'contain'} />,
        onSelected: () => {
          if (providerQuotes?.simplexQuote && userLocation?.ipAddress) {
            navigate(Screens.Simplex, {
              simplexQuote: providerQuotes?.simplexQuote,
              userIpAddress: userLocation.ipAddress,
            })
          }
        },
      },
      {
        name: 'Ramp',
        restricted: RAMP_RESTRICTED,
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media&token=548ab5b9-7b03-49a2-a196-198f45958852',
        onSelected: () => navigate(Screens.RampScreen, providerWidgetInputs),
      },
      {
        name: 'Transak',
        restricted: TRANSAK_RESTRICTED,
        icon:
          'https://storage.cloud.google.com/celo-mobile-mainnet.appspot.com/images/transak-icon.png',
        onSelected: () => navigate(Screens.TransakScreen, providerWidgetInputs),
      },
    ].sort(sortProviders),
  }

  const providerOnPress = (provider: Provider) => () => {
    ValoraAnalytics.track(FiatExchangeEvents.provider_chosen, {
      isCashIn,
      provider: provider.name,
    })
    dispatch(selectProvider(provider.name, provider.icon))
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
            <ListItem key={provider.name} onPress={providerOnPress(provider)}>
              <View style={styles.providerListItem} testID={`Provider/${provider.name}`}>
                <View style={styles.providerTextContainer}>
                  <Text
                    style={[
                      styles.optionTitle,
                      provider.unavailable ? { color: colors.gray4 } : null,
                    ]}
                  >
                    {provider.name}
                  </Text>
                  {provider.unavailable && (
                    <Text style={styles.restrictedText}>{t('providerUnavailable')}</Text>
                  )}
                  {provider.restricted && !provider.unavailable && (
                    <Text style={styles.restrictedText}>{t('restrictedRegion')}</Text>
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
