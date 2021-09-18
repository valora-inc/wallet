import ListItem from '@celo/react-components/components/ListItem'
import TextButton from '@celo/react-components/components/TextButton'
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
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import {
  fetchProviders,
  getLowestFeeValueFromQuotes,
  isSimplexQuote,
  ProviderQuote,
  SimplexQuote,
  sortProviders,
} from 'src/fiatExchanges/utils'
import i18n, { Namespaces } from 'src/i18n'
import QuestionIcon from 'src/icons/QuestionIcon'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import { CiCoCurrency, CURRENCIES, Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'ProviderOptionsScreen'

type Props = StackScreenProps<StackParamList, Screens.ProviderOptionsScreen>

export interface CicoProvider {
  name: string
  restricted: boolean
  unavailable?: boolean
  paymentMethods: PaymentMethod[]
  url?: string
  logo: string
  quote?: SimplexQuote | ProviderQuote[]
  cashIn: boolean
  cashOut: boolean
}

export enum IntegratedCicoProviders {
  Simplex = 'Simplex',
}

function ProviderOptionsScreen({ route, navigation }: Props) {
  const [showingExplanation, setShowExplanation] = useState(false)

  const onDismissExplanation = () => {
    setShowExplanation(false)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_select_provider_info_cancel)
  }
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const userLocation = useSelector(userLocationDataSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const isCashIn = route.params?.isCashIn ?? true

  const { paymentMethod } = route.params
  const currencyToBuy = {
    [Currency.Celo]: CiCoCurrency.CELO,
    [Currency.Dollar]: CiCoCurrency.CUSD,
    [Currency.Euro]: CiCoCurrency.CEUR,
  }[route.params.selectedCrypto]

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

  const asyncProviders = useAsync(async () => {
    if (!isFocused) {
      console.error(TAG, 'Screen is not in focus')
      return
    }

    if (!account) {
      console.error(TAG, 'No account set')
      return
    }

    try {
      const providers = await fetchProviders({
        userLocation,
        walletAddress: account,
        fiatCurrency: localCurrency,
        digitalAsset: currencyToBuy,
        fiatAmount: route.params.amount.fiat,
        digitalAssetAmount: route.params.amount.crypto,
        txType: isCashIn ? 'buy' : 'sell',
      })
      return providers
    } catch (error) {
      dispatch(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    }
  }, [isFocused])

  const activeProviders = asyncProviders.result

  const cicoProviders: {
    cashIn: CicoProvider[]
    cashOut: CicoProvider[]
  } = {
    cashIn:
      activeProviders
        ?.filter((provider) => provider.cashIn && !provider.restricted)
        .sort(sortProviders) || [],
    cashOut:
      activeProviders
        ?.filter((provider) => provider.cashOut && !provider.restricted)
        .sort(sortProviders) || [],
  }

  const availableProviders = (cashIn: boolean) =>
    cashIn ? !!cicoProviders.cashIn.length : !!cicoProviders.cashOut.length

  const supportOnPress = () => navigate(Screens.SupportContact)

  const switchCurrencyOnPress = () => navigate(Screens.FiatExchangeOptions, { isCashIn })

  const providerOnPress = (provider: CicoProvider) => () => {
    if (provider.unavailable) {
      return
    }

    ValoraAnalytics.track(FiatExchangeEvents.provider_chosen, {
      isCashIn,
      provider: provider.name,
    })

    if (provider.name === IntegratedCicoProviders.Simplex) {
      const providerQuote = Array.isArray(provider.quote) ? provider.quote[0] : provider.quote
      if (provider.quote && userLocation?.ipAddress && isSimplexQuote(providerQuote)) {
        navigate(Screens.Simplex, {
          simplexQuote: providerQuote,
          userIpAddress: userLocation.ipAddress,
        })
      }
      return
    }

    if (provider.url) {
      navigateToURI(provider.url)
      return
    }
  }

  const renderFeeAmount = (quote?: SimplexQuote | ProviderQuote[]) => {
    const feeAmount = getLowestFeeValueFromQuotes(quote)

    if (feeAmount === undefined) {
      return '-'
    }

    if (feeAmount === 0) {
      return t('global:free')
    }

    return (
      <CurrencyDisplay
        amount={{
          value: 0,
          localAmount: {
            value: feeAmount,
            currencyCode: localCurrency,
            exchangeRate: 1,
          },
          currencyCode: localCurrency,
        }}
        showLocalAmount={true}
        hideSign={true}
        style={styles.text}
      />
    )
  }

  return !userLocation || asyncProviders.status === 'loading' ? (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator size="large" color={colors.greenBrand} />
    </View>
  ) : (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        {!availableProviders(isCashIn) ? (
          <View style={styles.noProvidersContainer}>
            <Text testID={'noProviders'} style={styles.noProviders}>
              {t('noProviders', { digitalAsset: CURRENCIES[route.params.selectedCrypto].cashTag })}
            </Text>
            {currencyToBuy === CiCoCurrency.CEUR && (
              <TextButton
                testID={'SwitchCurrency'}
                style={styles.switchCurrency}
                onPress={switchCurrencyOnPress}
              >
                {t('switchCurrency')}
              </TextButton>
            )}
            <TextButton
              testID={'ContactSupport'}
              style={styles.contactSupport}
              onPress={supportOnPress}
            >
              {t('global:contactSupport')}
            </TextButton>
          </View>
        ) : (
          <>
            <Text style={styles.pleaseSelectProvider}>{t('pleaseSelectProvider')}</Text>
            <View style={styles.providersContainer}>
              {cicoProviders[isCashIn ? 'cashIn' : 'cashOut'].map((provider) => (
                <ListItem key={provider.name} onPress={providerOnPress(provider)}>
                  <View style={styles.providerListItem} testID={`Provider/${provider.name}`}>
                    <View style={styles.providerTextAndIconContainer}>
                      <View style={[styles.iconContainer]}>
                        <Image
                          testID={`Icon/${provider.name}`}
                          source={{ uri: provider.logo }}
                          style={styles.iconImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.providerTextContainer}>
                        <Text
                          style={[
                            styles.text,
                            provider.unavailable ? { color: colors.gray4 } : null,
                          ]}
                        >
                          {provider.name}
                        </Text>
                        <View style={styles.providerSubtextContainer}>
                          {provider.unavailable && (
                            <Text style={styles.restrictedText}>{t('providerUnavailable')}</Text>
                          )}
                          {!provider.unavailable &&
                            !provider.restricted &&
                            !provider.paymentMethods.includes(paymentMethod) && (
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
                      </View>
                    </View>
                    <View style={styles.feeContainer}>
                      <Text style={styles.text}>{renderFeeAmount(provider.quote)}</Text>
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
          </>
        )}
      </SafeAreaView>
    </ScrollView>
  )
}

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

export default ProviderOptionsScreen

const styles = StyleSheet.create({
  container: {
    paddingBottom: variables.contentPadding,
    paddingRight: 8,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  pleaseSelectProvider: {
    ...fontStyles.regular,
    padding: variables.contentPadding,
  },
  noProvidersContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noProviders: {
    ...fontStyles.regular,
    padding: variables.contentPadding,
    textAlign: 'center',
  },
  switchCurrency: {
    ...fontStyles.large500,
    color: colors.greenUI,
    padding: 8,
  },
  contactSupport: {
    ...fontStyles.large500,
    color: colors.gray4,
    padding: 8,
  },
  providersContainer: {
    flex: 1,
  },
  providerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerTextAndIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerTextContainer: {
    paddingLeft: 8,
    flex: 1,
    flexDirection: 'column',
  },
  providerSubtextContainer: {
    flexDirection: 'row',
  },
  feeContainer: {
    paddingRight: 8,
    minWidth: 32,
    textAlign: 'center',
  },
  restrictedText: {
    ...fontStyles.small,
    color: colors.gray4,
    flex: 1,
    flexWrap: 'wrap',
  },
  text: {
    ...fontStyles.regular500,
  },
  iconContainer: {
    height: 48,
    width: 48,
    borderRadius: 48 / 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray1,
  },
  iconImage: {
    height: 28,
    width: 28,
  },
})
