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
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import { CurrencyCode } from 'src/config'
import { selectProvider } from 'src/fiatExchanges/actions'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CicoProviderNames } from 'src/fiatExchanges/reducer'
import {
  CicoService,
  MoonpayService,
  SimplexService,
  TransakService,
} from 'src/fiatExchanges/services'
import {
  fetchLocationFromIpAddress,
  getProviderAvailability,
  openMoonpay,
  openRamp,
  openSimplex,
  openTransak,
  renderFeesPolicy,
  fetchSimplexQuote,
  fetchUserLocationData,
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
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { providersDisplayInfo } from 'src/fiatExchanges/reducer'

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
  icon?: string
  iconColor?: string
  paymentMethods: PaymentMethod[]
  image?: React.ReactNode
  onSelected: () => void
  service?: CicoService
}

const simplexService = SimplexService.getInstance()
const transakService = TransakService.getInstance()
const moonpayService = MoonpayService.getInstance()

function ProviderOptionsScreen({ route, navigation }: Props) {
  const [showingExplanation, setShowExplanation] = useState(false)

  const onDismissExplanation = () => {
    setShowExplanation(false)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_select_provider_info_cancel)
  }
  const [providerFees, setProviderFees] = useState({} as any)

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
    if (!account || !userLocation?.ipAddress || !isFocused) {
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
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-alfajores.appspot.com/o/images%2Fmoonpay.svg?alt=media&token=e8f54502-37be-4106-951e-19240aa99c1c',
    iconColor: 'rgba(0, 0, 0, 0.07)',
    service: moonpayService,
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
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-alfajores.appspot.com/o/images%2Fsimplex.svg?alt=media&token=6c989a40-0d98-4115-90d0-9b8eae955dc1',
    iconColor: 'rgba(96, 169, 64, 0.07)',
    service: simplexService,
  }

  const ramp = {
    id: CicoProviderNames.Ramp,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    restricted: RAMP_RESTRICTED,
    onSelected: () => navigate(Screens.RampScreen, providerWidgetInputs),
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-alfajores.appspot.com/o/images%2Framp.svg?alt=media&token=8a02a1aa-0509-4d83-87f1-53a25685b34d',
    iconColor: 'rgba(2, 194, 108, 0.07)',
  }

  const transak = {
    id: CicoProviderNames.Transak,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    restricted: TRANSAK_RESTRICTED,
    onSelected: () => navigate(Screens.TransakScreen, providerWidgetInputs),
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-alfajores.appspot.com/o/images%2Fmoonpay.svg?alt=media&token=e8f54502-37be-4106-951e-19240aa99c1c',
    service: transakService,
  }

  const providers: {
    cashOut: CicoProvider[]
    cashIn: CicoProvider[]
  } = {
    cashOut: [xanpool].sort(sortProviders),
    cashIn: [moonpay, simplex, xanpool, ramp, transak].sort(sortProviders),
  }

  const selectedProviders = providers[isCashIn ? 'cashIn' : 'cashOut']

  React.useEffect(() => {
    const feesMap: any = {}
    selectedProviders
      .filter(({ restricted }) => !restricted)
      .map(async ({ id, service }) => [
        id,
        (
          (await service
            ?.getFees?.(
              route.params.selectedCrypto,
              localCurrency,
              route.params.amount.fiat,
              paymentMethod
            )
            .catch(() => ({ fee: null }))) || { fee: null }
        )?.fee,
      ])
      .forEach(async (result) => {
        const [name, fee] = await result
        feesMap[name as string] = fee
        setProviderFees({ ...providerFees, ...feesMap })
      })
  }, [
    route.params.amount,
    localCurrency,
    route.params.selectedCrypto,
    ...selectedProviders.map(({ id }) => id),
  ])

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
          {selectedProviders.map((provider) => (
            <ListItem key={provider.id} onPress={providerOnPress(provider)}>
              <View style={styles.providerListItem} testID={`Provider/${provider.id}`}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: provider.iconColor || colors.gray1 },
                  ]}
                >
                  <Image
                    source={{ uri: provider.icon }}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.option}>
                  <View style={styles.optionTitle}>
                    <Text
                      style={[
                        styles.optionTitle,
                        provider.unavailable ? { color: colors.gray4 } : null,
                      ]}
                    >
                      {providersDisplayInfo[provider.id].name}
                    </Text>
                    {provider.unavailable && (
                      <Text style={styles.restrictedText}>{t('providerUnavailable')}</Text>
                    )}
                    {provider.restricted && !provider.unavailable && (
                      <Text style={styles.restrictedText}>{t('restrictedRegion')}</Text>
                    )}
                    {!provider.restricted &&
                    !provider.unavailable &&
                    !provider.paymentMethods.includes(paymentMethod) ? (
                      <Text style={styles.restrictedText}>
                        {t('unsupportedPaymentMethod', {
                          paymentMethod: t(
                            paymentMethod === PaymentMethod.Bank ? 'payWithBank' : 'payWithCard'
                          ).toLowerCase(),
                        })}
                      </Text>
                    ) : (
                      <Text style={styles.optionFeesData}>
                        Fee: {renderFeesPolicy(provider.service?.getFeesPolicy?.(paymentMethod))}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.optionTitle}>
                      {providerFees[provider.id] ? (
                        <CurrencyDisplay
                          amount={{
                            value: 0,
                            localAmount: {
                              value: providerFees[provider.id],
                              currencyCode: localCurrency,
                              exchangeRate: 1,
                            },
                            currencyCode: localCurrency,
                          }}
                          hideSymbol={false}
                          showLocalAmount={true}
                          hideSign={true}
                          showExplicitPositiveSign={false}
                          style={[styles.optionTitle]}
                        />
                      ) : providerFees[provider.id] === null ? (
                        '-'
                      ) : (
                        <ActivityIndicator size={14} color={colors.greenBrand} />
                      )}{' '}
                      fee
                    </Text>
                  </View>
                </View>
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
  iconContainer: {
    height: 48,
    width: 48,
    borderRadius: 48 / 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    height: 28,
    width: 28,
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
    maxWidth: '100%',
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
  optionFeesData: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 4,
  },
  option: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingLeft: 8,
  },
  optionTitle: {
    flex: 1,
    paddingRight: 12,
  },
})
