import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import Touchable from 'src/components/Touchable'
import { PaymentMethodSection } from 'src/fiatExchanges/PaymentMethodSection'
import i18n from 'src/i18n'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  CICOFlow,
  CicoQuote,
  fetchLegacyMobileMoneyProviders,
  fetchProviders,
  filterLegacyMobileMoneyProviders,
  getQuotes,
  LegacyMobileMoneyProvider,
  PaymentMethod,
  sortQuotesByFee,
} from './utils'

const TAG = 'SelectProviderScreen'

type Props = StackScreenProps<StackParamList, Screens.SelectProvider>

export default function SelectProviderScreen({ route, navigation }: Props) {
  const dispatch = useDispatch()
  const userLocation = useSelector(userLocationDataSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const [noPaymentMethods, setNoPaymentMethods] = useState(false)
  const { flow } = route.params

  const digitalAsset = {
    [Currency.Celo]: CiCoCurrency.CELO,
    [Currency.Dollar]: CiCoCurrency.CUSD,
    [Currency.Euro]: CiCoCurrency.CEUR,
  }[route.params.selectedCrypto]

  const asyncProviders = useAsync(async () => {
    if (!account) {
      Logger.error(TAG, 'No account set')
      return
    }
    try {
      const providers = await fetchProviders({
        userLocation,
        walletAddress: account,
        fiatCurrency: localCurrency,
        digitalAsset,
        fiatAmount: route.params.amount.fiat,
        digitalAssetAmount: route.params.amount.crypto,
        txType: flow === CICOFlow.CashIn ? 'buy' : 'sell',
      })
      const rawLegacyMobileMoneyProviders = await fetchLegacyMobileMoneyProviders()
      const legacyMobileMoneyProviders = filterLegacyMobileMoneyProviders(
        rawLegacyMobileMoneyProviders,
        flow,
        userLocation.countryCodeAlpha2,
        digitalAsset
      )

      return { providers, legacyMobileMoneyProviders }
    } catch (error) {
      dispatch(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    }
  }, [])

  if (asyncProviders.loading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }
  const activeProviders = asyncProviders.result?.providers

  const cicoQuotes: CicoQuote[] =
    getQuotes(activeProviders)
      ?.filter(({ quote }) => (flow === CICOFlow.CashIn ? quote.cashIn : quote.cashOut))
      .sort(sortQuotesByFee) || []
  return (
    <ScrollView>
      <PaymentMethodSection
        cicoQuotes={cicoQuotes}
        paymentMethod={PaymentMethod.Card}
        setNoPaymentMethods={setNoPaymentMethods}
        flow={flow}
      />
      <PaymentMethodSection
        cicoQuotes={cicoQuotes}
        paymentMethod={PaymentMethod.Bank}
        setNoPaymentMethods={setNoPaymentMethods}
        flow={flow}
      />
      <LegacyMobileMoneySection
        providers={asyncProviders.result?.legacyMobileMoneyProviders || []}
        digitalAsset={digitalAsset}
        flow={flow}
      />
      <ExchangesSection selectedCurrency={route.params.selectedCrypto} flow={flow} />
      <LimitedPaymentMethods visible={noPaymentMethods} flow={flow} />
    </ScrollView>
  )
}

function LimitedPaymentMethods({ visible, flow }: { visible: boolean; flow: CICOFlow }) {
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
    if (visible) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_unavailable_impression, {
        flow,
      })
    }
  }, [])
  return (
    <>
      {visible && (
        <View style={styles.noQuotesContainer}>
          <Text style={styles.noQuotesText}>
            {t('selectProviderScreen.somePaymentsUnavailable')}{' '}
            <Text onPress={openDialog} style={styles.underline}>
              {t('selectProviderScreen.learnMore')}
            </Text>
          </Text>
        </View>
      )}
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
  flow,
  selectedCurrency,
}: {
  flow: CICOFlow
  selectedCurrency: Currency
}) {
  const { t } = useTranslation()
  const goToExchangesScreen = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_providers_exchanges_selected, {
      flow,
    })
    navigate(Screens.ExternalExchanges, {
      currency: selectedCurrency,
      isCashIn: flow === CICOFlow.CashIn,
    })
  }

  return (
    <View testID="Exchanges" style={styles.container}>
      <Touchable onPress={goToExchangesScreen}>
        <View style={{ ...styles.expandableContainer, paddingVertical: 27 }}>
          <View style={styles.left}>
            <Text style={styles.category}>{t('selectProviderScreen.cryptoExchange')}</Text>

            <Text style={styles.fee}>{t('selectProviderScreen.feesVary')}</Text>
          </View>

          <View style={styles.right}>
            <Text style={styles.linkToOtherScreen}>{t('selectProviderScreen.viewExchanges')}</Text>
          </View>
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
    navigateToURI(provider[digitalAsset === CiCoCurrency.CUSD ? 'cusd' : 'celo'].url)
  }

  if (!provider) {
    return null
  }
  return (
    <View style={styles.container}>
      <Touchable onPress={goToProviderSite}>
        <View style={{ ...styles.expandableContainer, paddingVertical: 27 }}>
          <View style={styles.left}>
            <Text style={styles.category}>{t('selectProviderScreen.mobileMoney')}</Text>
            <Text style={styles.fee}>{t('selectProviderScreen.feesVary')}</Text>
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
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  category: {
    ...fontStyles.small500,
  },
  fee: {
    ...fontStyles.regular500,
    marginTop: 4,
  },
  linkToOtherScreen: {
    ...fontStyles.small500,
    color: colors.gray4,
  },
  noQuotesContainer: {
    padding: 16,
  },
  noQuotesText: {
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
