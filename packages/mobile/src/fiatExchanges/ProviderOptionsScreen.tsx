import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import { RouteProp } from '@react-navigation/native'
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
import {
  fetchLocationFromIpAddress,
  getProviderAvailability,
  openMoonpay,
  openRamp,
  openSimplex,
  openTransak,
  UserLocation,
} from 'src/fiatExchanges/utils'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import QuestionIcon from 'src/icons/QuestionIcon'
import { moonpayLogo, simplexLogo } from 'src/images/Images'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
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
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: i18n.t(`fiatExchangeFlow:${route.params?.isCashIn ? 'addFunds' : 'cashOut'}`),
  }
}

interface Provider {
  name: string
  restricted: boolean
  icon: string
  image?: React.ReactNode
  onSelected: () => void
}

export enum Providers {
  MOONPAY = 'MOONPAY',
  RAMP = 'RAMP',
  TRANSAK = 'TRANSAK',
  SIMPLEX = 'SIMPLEX',
}

const FALLBACK_CURRENCY = LocalCurrencyCode.USD

function ProviderOptionsScreen({ route, navigation }: Props) {
  const [showingExplanation, setShowExplanation] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation>()
  const onDismissExplanation = () => setShowExplanation(false)

  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const countryCallingCode = useSelector(defaultCountryCodeSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const isCashIn = route.params?.isCashIn ?? true
  const {
    MOONPAY_RESTRICTED,
    SIMPLEX_RESTRICTED,
    RAMP_RESTRICTED,
    TRANSAK_RESTRICTED,
  } = getProviderAvailability(userLocation)
  const selectedCurrency = {
    [CURRENCY_ENUM.GOLD]: CurrencyCode.CELO,
    [CURRENCY_ENUM.DOLLAR]: CurrencyCode.CUSD,
  }[route.params.currency || CURRENCY_ENUM.DOLLAR]

  const dispatch = useDispatch()

  useLayoutEffect(() => {
    const showExplanation = () => setShowExplanation(true)

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

  useAsync(async () => {
    try {
      const locationData = await fetchLocationFromIpAddress()
      if (!locationData) {
        throw Error('Url returned from service is invalid')
      }

      const { alpha2, state } = locationData
      setUserLocation({ country: alpha2, state })
    } catch (error) {
      const country = countryCallingCode ? getRegionCodeFromCountryCode(countryCallingCode) : null
      setUserLocation({ country, state: null })
    }
  }, [])

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
        onSelected: () =>
          openMoonpay(route.params.amount, localCurrency || FALLBACK_CURRENCY, selectedCurrency),
      },
      {
        name: 'Simplex',
        restricted: SIMPLEX_RESTRICTED,
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media&token=6037b2f9-9d76-4076-b29e-b7e0de0b3f34',
        image: <Image source={simplexLogo} style={styles.logo} resizeMode={'contain'} />,
        onSelected: () => openSimplex(account),
      },
      {
        name: 'Ramp',
        restricted: RAMP_RESTRICTED,
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media&token=548ab5b9-7b03-49a2-a196-198f45958852',
        onSelected: () =>
          openRamp(route.params.amount, localCurrency || FALLBACK_CURRENCY, selectedCurrency),
      },
      {
        name: 'Transak',
        restricted: TRANSAK_RESTRICTED,
        icon:
          'https://storage.cloud.google.com/celo-mobile-mainnet.appspot.com/images/transak-icon.png',
        onSelected: () =>
          openTransak(route.params.amount, localCurrency || FALLBACK_CURRENCY, selectedCurrency),
      },
    ],
  }

  const providerOnPress = (provider: Provider) => () => {
    ValoraAnalytics.track(FiatExchangeEvents.provider_chosen, {
      isCashIn,
      provider: provider.name,
    })
    dispatch(selectProvider(provider.name, provider.icon))
    provider.onSelected()
  }

  return !userLocation ? (
    <View style={styles.container}>
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
                  <Text style={styles.optionTitle}>{provider.name}</Text>
                  {provider.restricted && (
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
    ...fontStyles.regular,
  },
})
