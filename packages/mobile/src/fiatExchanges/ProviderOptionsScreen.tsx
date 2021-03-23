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
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import { CurrencyCode } from 'src/config'
import { selectProvider } from 'src/fiatExchanges/actions'
import { CiCoProvider, providersDisplayInfo } from 'src/fiatExchanges/reducer'
import {
  fetchLocationFromIpAddress,
  getProviderAvailability,
  openMoonpay,
  openRamp,
  openSimplex,
  sortProviders,
  UserLocation,
} from 'src/fiatExchanges/utils'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import QuestionIcon from 'src/icons/QuestionIcon'
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
  id: CiCoProvider
  restricted: boolean
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
  const onDismissExplanation = () => {
    setShowExplanation(false)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_select_provider_info_cancel)
  }
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const countryCallingCode = useSelector(defaultCountryCodeSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const isCashIn = route.params?.isCashIn ?? true
  const selectedCurrency = {
    [CURRENCY_ENUM.GOLD]: CurrencyCode.CELO,
    [CURRENCY_ENUM.DOLLAR]: CurrencyCode.CUSD,
  }[route.params.currency || CURRENCY_ENUM.DOLLAR]

  const dispatch = useDispatch()

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

  const asyncUserLocation = useAsync(async () => {
    try {
      const { alpha2, state } = await fetchLocationFromIpAddress()
      if (!alpha2) {
        throw Error('Could not determine country from IP address')
      }

      return { country: alpha2, state }
    } catch (error) {
      const alpha2 = countryCallingCode ? getRegionCodeFromCountryCode(countryCallingCode) : null
      return { country: alpha2, state: null }
    }
  }, [])

  const userLocation: UserLocation | undefined = asyncUserLocation.result

  const {
    MOONPAY_RESTRICTED,
    SIMPLEX_RESTRICTED,
    RAMP_RESTRICTED,
    TRANSAK_RESTRICTED,
  } = getProviderAvailability(userLocation)

  const providers: {
    cashOut: Provider[]
    cashIn: Provider[]
  } = {
    cashOut: [],
    cashIn: [
      {
        id: CiCoProvider.Moonpay,
        restricted: MOONPAY_RESTRICTED,
        onSelected: () =>
          openMoonpay(route.params.amount, localCurrency || FALLBACK_CURRENCY, selectedCurrency),
      },
      {
        id: CiCoProvider.Simplex,
        restricted: SIMPLEX_RESTRICTED,
        onSelected: () => openSimplex(account),
      },
      {
        id: CiCoProvider.Ramp,
        restricted: RAMP_RESTRICTED,
        onSelected: () =>
          openRamp(route.params.amount, localCurrency || FALLBACK_CURRENCY, selectedCurrency),
      },
      // Commenting out until we have completed KYB for Transak
      // {
      //   id: CiCoProvider.Transak,
      //   restricted: TRANSAK_RESTRICTED,
      //   onSelected: () =>
      //     openTransak(route.params.amount, localCurrency || FALLBACK_CURRENCY, selectedCurrency),
      // },
    ].sort(sortProviders),
  }

  const providerOnPress = (provider: Provider) => () => {
    ValoraAnalytics.track(FiatExchangeEvents.provider_chosen, {
      isCashIn,
      provider: provider.id,
    })
    dispatch(selectProvider(provider.id))
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
            <ListItem key={provider.id} onPress={providerOnPress(provider)}>
              <View style={styles.providerListItem} testID={`Provider/${provider.id}`}>
                <View style={styles.providerTextContainer}>
                  <Text style={styles.optionTitle}>{providersDisplayInfo[provider.id].name}</Text>
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
