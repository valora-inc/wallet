import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { coinbasePayEnabledSelector } from 'src/app/selectors'
import { FUNDING_LINK } from 'src/brandingConfig'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import TextButton from 'src/components/TextButton'
import Touchable from 'src/components/Touchable'
import {
  fiatConnectProvidersSelector,
  fiatConnectQuotesErrorSelector,
  fiatConnectQuotesLoadingSelector,
  fiatConnectQuotesSelector,
  selectFiatConnectQuoteLoadingSelector,
} from 'src/fiatconnect/selectors'
import { fetchFiatConnectProviders, fetchFiatConnectQuotes } from 'src/fiatconnect/slice'
import { CoinbasePaymentSection } from 'src/fiatExchanges/CoinbasePaymentSection'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import {
  PaymentMethodSection,
  PaymentMethodSectionMethods,
} from 'src/fiatExchanges/PaymentMethodSection'
import { normalizeQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { SelectProviderExchangesLink, SelectProviderExchangesText } from 'src/fiatExchanges/types'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import i18n from 'src/i18n'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { CiCoCurrency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  CICOFlow,
  fetchExchanges,
  fetchLegacyMobileMoneyProviders,
  fetchProviders,
  FiatExchangeFlow,
  filterLegacyMobileMoneyProviders,
  filterProvidersByPaymentMethod,
  LegacyMobileMoneyProvider,
  PaymentMethod,
  resolveCloudFunctionDigitalAsset,
} from './utils'

const TAG = 'SelectProviderScreen'

type Props = NativeStackScreenProps<StackParamList, Screens.SelectProvider>

function getAddFundsCryptoExchangeExperimentParams() {
  return getExperimentParams(
    ExperimentConfigs[StatsigExperiments.ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE]
  )
}

const paymentMethodSections: PaymentMethodSectionMethods[] = [
  PaymentMethod.Card,
  PaymentMethod.Bank,
  PaymentMethod.FiatConnectMobileMoney,
]

export default function SelectProviderScreen({ route, navigation }: Props) {
  const dispatch = useDispatch()
  const userLocation = useSelector(userLocationDataSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const fiatConnectQuotes = useSelector(fiatConnectQuotesSelector)
  const fiatConnectQuotesLoading = useSelector(fiatConnectQuotesLoadingSelector)
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)
  const fiatConnectProviders = useSelector(fiatConnectProvidersSelector)
  const selectFiatConnectQuoteLoading = useSelector(selectFiatConnectQuoteLoadingSelector)

  const { flow, selectedCrypto: digitalAsset } = route.params
  const { t } = useTranslation()
  const coinbasePayEnabled = useSelector(coinbasePayEnabledSelector)
  const appIdResponse = useAsync(async () => readOnceFromFirebase('coinbasePay/appId'), [])
  const appId = appIdResponse.result

  // If there is no FC providers in the redux cache, try to fetch again
  useEffect(() => {
    if (!fiatConnectProviders) {
      dispatch(fetchFiatConnectProviders())
    }
  }, [fiatConnectProviders])

  useEffect(() => {
    dispatch(
      fetchFiatConnectQuotes({
        flow,
        digitalAsset,
        cryptoAmount: route.params.amount.crypto,
        fiatAmount: route.params.amount.fiat,
      })
    )
  }, [flow, digitalAsset, route.params.amount.crypto, fiatConnectProviders])

  useEffect(() => {
    if (fiatConnectQuotesError) {
      dispatch(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    }
  }, [fiatConnectQuotesError])

  const asyncExchanges = useAsync(async () => {
    try {
      const availableExchanges = await fetchExchanges(
        userLocation.countryCodeAlpha2,
        route.params.selectedCrypto
      )

      return availableExchanges
    } catch (error) {
      Logger.error(TAG, 'error fetching exchanges, displaying an empty array')
      return []
    }
  }, [])

  const asyncProviders = useAsync(async () => {
    if (!account) {
      Logger.error(TAG, 'No account set')
      return
    }
    try {
      const [externalProviders, rawLegacyMobileMoneyProviders] = await Promise.all([
        fetchProviders({
          userLocation,
          walletAddress: account,
          fiatCurrency: localCurrency,
          digitalAsset: resolveCloudFunctionDigitalAsset(digitalAsset),
          fiatAmount: route.params.amount.fiat,
          digitalAssetAmount: route.params.amount.crypto,
          txType: flow === CICOFlow.CashIn ? 'buy' : 'sell',
        }),
        fetchLegacyMobileMoneyProviders(),
      ])

      const legacyMobileMoneyProviders = filterLegacyMobileMoneyProviders(
        rawLegacyMobileMoneyProviders,
        flow,
        userLocation.countryCodeAlpha2,
        digitalAsset
      )
      return { externalProviders, legacyMobileMoneyProviders }
    } catch (error) {
      dispatch(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    }
  }, [])

  if (
    asyncProviders.loading ||
    fiatConnectQuotesLoading ||
    asyncExchanges.loading ||
    selectFiatConnectQuoteLoading
  ) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }
  const normalizedQuotes = normalizeQuotes(
    flow,
    fiatConnectQuotes,
    asyncProviders.result?.externalProviders,
    digitalAsset
  )

  const availablePaymentMethods = normalizedQuotes.map((quote) => quote.getPaymentMethod())
  const somePaymentMethodsUnavailable = !paymentMethodSections.every((method) =>
    availablePaymentMethods.includes(method)
  )

  const coinbaseProvider = filterProvidersByPaymentMethod(
    PaymentMethod.Coinbase,
    asyncProviders.result?.externalProviders
  )

  const supportOnPress = () => navigate(Screens.SupportContact)

  const handlePressDisclaimer = () => {
    navigate(Screens.WebViewScreen, { uri: FUNDING_LINK })
  }

  const switchCurrencyOnPress = () =>
    navigate(Screens.FiatExchangeCurrency, {
      flow:
        route.params.flow === CICOFlow.CashIn ? FiatExchangeFlow.CashIn : FiatExchangeFlow.CashOut,
    })

  const exchanges = asyncExchanges.result ?? []
  const legacyMobileMoneyProviders = asyncProviders.result?.legacyMobileMoneyProviders

  const coinbasePayVisible =
    flow === CICOFlow.CashIn &&
    coinbaseProvider &&
    !coinbaseProvider.restricted &&
    coinbasePayEnabled &&
    appId &&
    digitalAsset === CiCoCurrency.CELO

  const anyProviders =
    normalizedQuotes.length ||
    coinbasePayVisible ||
    exchanges.length ||
    legacyMobileMoneyProviders?.length

  if (!anyProviders) {
    return (
      <View style={styles.noPaymentMethodsContainer}>
        <Text testID="NoPaymentMethods" style={styles.noPaymentMethods}>
          {t('noPaymentMethods', {
            digitalAsset,
          })}
        </Text>
        <TextButton
          testID={'SwitchCurrency'}
          style={styles.switchCurrency}
          onPress={switchCurrencyOnPress}
        >
          {t('switchCurrency')}
        </TextButton>
        <TextButton
          testID={'ContactSupport'}
          style={styles.contactSupport}
          onPress={supportOnPress}
        >
          {t('contactSupport')}
        </TextButton>
      </View>
    )
  }

  return (
    <ScrollView>
      {paymentMethodSections.map((paymentMethod) => (
        <PaymentMethodSection
          key={paymentMethod}
          normalizedQuotes={normalizedQuotes}
          paymentMethod={paymentMethod}
          flow={flow}
          cryptoType={digitalAsset}
        />
      ))}
      <LegacyMobileMoneySection
        providers={legacyMobileMoneyProviders || []}
        digitalAsset={digitalAsset}
        flow={flow}
      />
      {coinbaseProvider && coinbasePayVisible && (
        <CoinbasePaymentSection
          cryptoAmount={route.params.amount.crypto}
          coinbaseProvider={coinbaseProvider}
          appId={appId}
        />
      )}
      <ExchangesSection
        exchanges={exchanges}
        selectedCurrency={route.params.selectedCrypto}
        flow={flow}
      />

      {somePaymentMethodsUnavailable ? (
        <LimitedPaymentMethods flow={flow} />
      ) : (
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            <Trans i18nKey="selectProviderScreen.disclaimer">
              <Text style={styles.underline} onPress={handlePressDisclaimer}></Text>
            </Trans>
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

function LimitedPaymentMethods({ flow }: { flow: CICOFlow }) {
  const { t } = useTranslation()
  const [isDialogVisible, setIsDialogVisible] = useState(false)

  const dismissDialog = () => {
    setIsDialogVisible(false)
  }
  const openDialog = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_providers_unavailable_selected, {
      flow,
    })
    setIsDialogVisible(true)
  }

  useEffect(() => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_providers_unavailable_impression, {
      flow,
    })
  }, [])

  return (
    <>
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          <Trans i18nKey="selectProviderScreen.disclaimerWithSomePaymentsUnavailable">
            <Text style={styles.underline} onPress={openDialog}></Text>
          </Trans>
        </Text>
      </View>
      <Dialog
        title={t('selectProviderScreen.whyMissingPayments')}
        isVisible={isDialogVisible}
        actionText={t('selectProviderScreen.dismiss')}
        actionPress={dismissDialog}
        isActionHighlighted={false}
        onBackgroundPress={dismissDialog}
      >
        <Text style={styles.dialog}>{t('selectProviderScreen.missingPaymentsExplained')}</Text>
      </Dialog>
    </>
  )
}

function ExchangesSection({
  exchanges = [],
  flow,
  selectedCurrency,
}: {
  exchanges: ExternalExchangeProvider[]
  flow: CICOFlow
  selectedCurrency: CiCoCurrency
}) {
  const { t } = useTranslation()

  const { addFundsExchangesText: exchangesText, addFundsExchangesLink: exchangesLink } =
    useMemo(() => {
      if (flow === CICOFlow.CashIn) {
        return getAddFundsCryptoExchangeExperimentParams()
      }
      return {
        addFundsExchangesText: SelectProviderExchangesText.CryptoExchange,
        addFundsExchangesLink: SelectProviderExchangesLink.ExternalExchangesScreen,
      }
    }, [flow])

  if (!exchanges.length) {
    return null
  }

  const goToExchangesScreen = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_providers_exchanges_selected, {
      flow,
    })
    if (exchangesLink === SelectProviderExchangesLink.ExchangeQRScreen) {
      navigate(Screens.ExchangeQR, { flow, exchanges })
    } else {
      navigate(Screens.ExternalExchanges, {
        currency: selectedCurrency,
        isCashIn: flow === CICOFlow.CashIn,
        exchanges,
      })
    }
  }

  let header: string
  let text: string
  let rightText: string | null = null

  if (exchangesText === SelectProviderExchangesText.DepositFrom) {
    header = t('selectProviderScreen.depositFrom')
    text = t('selectProviderScreen.cryptoExchangeOrWallet')
  } else {
    header = t('selectProviderScreen.cryptoExchange')
    text = t('selectProviderScreen.feesVary')
    rightText = t('selectProviderScreen.viewExchanges')
  }

  return (
    <View testID="Exchanges" style={styles.container}>
      <Touchable onPress={goToExchangesScreen}>
        <View style={{ ...styles.expandableContainer, paddingVertical: 27 }}>
          <View style={styles.left}>
            <Text style={styles.categoryHeader}>{header}</Text>
            <Text style={styles.categoryText}>{text}</Text>
          </View>

          {rightText && (
            <View style={styles.right}>
              <Text style={styles.linkToOtherScreen}>{rightText}</Text>
            </View>
          )}
        </View>
      </Touchable>
    </View>
  )
}

function LegacyMobileMoneySection({
  providers,
  digitalAsset,
  flow,
}: {
  providers: LegacyMobileMoneyProvider[]
  digitalAsset: CiCoCurrency
  flow: CICOFlow
}) {
  const { t } = useTranslation()

  /**
   *  This component assumes that there is only one legacy mobile money provider at a time. When we add FiatConnect mobile money providers this
   * assumption will no longer be true and the UI will have to be updated to be more dynamic. Consider making PaymentMethodSection more
   * flexible to be able to handle mobile money as well when we start adding FiatConnect support.
   */
  const provider = providers[0]

  useEffect(() => {
    if (provider) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_section_impression, {
        flow,
        paymentMethod: PaymentMethod.MobileMoney,
        quoteCount: 1,
        providers: [provider.name],
      })
    }
  }, [])

  const goToProviderSite = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
      flow,
      paymentMethod: PaymentMethod.MobileMoney,
      provider: provider.name,
    })
    navigateToURI(provider[digitalAsset === CiCoCurrency.cUSD ? 'cusd' : 'celo'].url)
  }

  if (!provider) {
    return null
  }
  return (
    <View testID="LegacyMobileMoneySection" style={styles.container}>
      <Touchable onPress={goToProviderSite}>
        <View style={{ ...styles.expandableContainer, paddingVertical: 27 }}>
          <View style={styles.left}>
            <Text style={styles.categoryText}>{t('selectProviderScreen.feesVary')}</Text>
          </View>

          <View style={styles.right}>
            <Text style={styles.linkToOtherScreen}>{provider.name}</Text>
          </View>
        </View>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
  },
  expandableContainer: {
    paddingHorizontal: Spacing.Regular16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noPaymentMethods: {
    ...fontStyles.regular,
    padding: variables.contentPadding,
    textAlign: 'center',
  },
  switchCurrency: {
    ...fontStyles.large500,
    color: colors.greenUI,
    padding: Spacing.Smallest8,
  },
  noPaymentMethodsContainer: {
    alignItems: 'center',
    padding: Spacing.Thick24,
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  categoryHeader: {
    ...fontStyles.small500,
  },
  categoryText: {
    ...fontStyles.regular500,
    marginTop: 4,
  },
  linkToOtherScreen: {
    ...fontStyles.small500,
    color: colors.gray4,
  },
  disclaimerContainer: {
    padding: Spacing.Regular16,
  },
  disclaimerText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  dialog: {
    ...fontStyles.regular,
    textAlign: 'center',
  },
  contactSupport: {
    ...fontStyles.large500,
    color: colors.gray4,
    padding: Spacing.Smallest8,
  },
})
SelectProviderScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.SelectProvider>
}) => ({
  ...emptyHeader,
  headerLeft: () => (
    <BackButton
      eventName={FiatExchangeEvents.cico_providers_back}
      eventProperties={{ flow: route.params.flow }}
    />
  ),
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatExchangeFlow.cashIn.selectProviderHeader`)
      : i18n.t(`fiatExchangeFlow.cashOut.selectProviderHeader`),
})
