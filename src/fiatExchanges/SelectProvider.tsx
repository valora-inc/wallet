import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import _ from 'lodash'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import TextButton from 'src/components/TextButton'
import Touchable from 'src/components/Touchable'
import { FETCH_FIATCONNECT_QUOTES } from 'src/config'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import {
  PaymentMethodSection,
  PaymentMethodSectionMethods,
} from 'src/fiatExchanges/PaymentMethodSection'
import { CryptoAmount, FiatAmount } from 'src/fiatExchanges/amount'
import { normalizeQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import {
  CICOFlow,
  FiatExchangeFlow,
  PaymentMethod,
  ProviderSelectionAnalyticsData,
  SelectProviderExchangesLink,
  SelectProviderExchangesText,
} from 'src/fiatExchanges/types'
import {
  LegacyMobileMoneyProvider,
  fetchCicoQuotes,
  fetchExchanges,
  fetchLegacyMobileMoneyProviders,
  filterLegacyMobileMoneyProviders,
  getProviderSelectionAnalyticsData,
} from 'src/fiatExchanges/utils'
import {
  fiatConnectQuotesErrorSelector,
  fiatConnectQuotesLoadingSelector,
  fiatConnectQuotesSelector,
  selectFiatConnectQuoteLoadingSelector,
} from 'src/fiatconnect/selectors'
import { fetchFiatConnectQuotes } from 'src/fiatconnect/slice'
import {
  getDefaultLocalCurrencyCode,
  getLocalCurrencyCode,
  usdToLocalCurrencyRateSelector,
} from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { navigateToURI } from 'src/utils/linking'
import networkConfig from 'src/web3/networkConfig'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'SelectProviderScreen'

type Props = NativeStackScreenProps<StackParamList, Screens.SelectProvider>

const paymentMethodSections: PaymentMethodSectionMethods[] = [
  PaymentMethod.Card,
  PaymentMethod.Bank,
  PaymentMethod.FiatConnectMobileMoney,
  PaymentMethod.Airtime,
]

export default function SelectProviderScreen({ route, navigation }: Props) {
  const dispatch = useDispatch()
  const {
    flow,
    tokenId,
    amount: { crypto: cryptoAmount, fiat: fiatAmount },
  } = route.params
  const userLocation = useSelector(userLocationDataSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const defaultCurrency = useSelector(getDefaultLocalCurrencyCode)
  const fiatConnectQuotes = useSelector(fiatConnectQuotesSelector)
  const fiatConnectQuotesLoading = useSelector(fiatConnectQuotesLoadingSelector)
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)
  const selectFiatConnectQuoteLoading = useSelector(selectFiatConnectQuoteLoadingSelector)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const tokenInfo = useTokenInfo(tokenId)

  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])
  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

  if (!tokenInfo) {
    throw new Error(`Token info not found for token ID ${tokenId}`)
  }

  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (FETCH_FIATCONNECT_QUOTES) {
      dispatch(
        fetchFiatConnectQuotes({
          flow,
          digitalAsset: tokenInfo.symbol,
          cryptoAmount,
          fiatAmount,
        })
      )
    }
  }, [flow, tokenInfo.symbol, cryptoAmount])

  useEffect(() => {
    if (fiatConnectQuotesError) {
      dispatch(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    }
  }, [fiatConnectQuotesError])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle:
        route.params.flow === CICOFlow.CashIn
          ? t(`fiatExchangeFlow.cashIn.selectProviderHeader`, {
              context: showUKCompliantVariant ? 'UK' : undefined,
            })
          : t(`fiatExchangeFlow.cashOut.selectProviderHeader`),
    })
  }, [route.params.flow])

  const asyncExchanges = useAsync(async () => {
    try {
      const availableExchanges = await fetchExchanges(
        userLocation.countryCodeAlpha2,
        tokenInfo.tokenId
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
      const [cicoQuotesResponse, rawLegacyMobileMoneyProviders] = await Promise.all([
        fetchCicoQuotes({
          tokenId,
          fiatCurrency: localCurrency,
          address: account,
          userLocation,
          ...(flow === CICOFlow.CashIn
            ? { txType: 'cashIn', fiatAmount: fiatAmount.toString() }
            : { txType: 'cashOut', cryptoAmount: cryptoAmount.toString() }),
        }),
        fetchLegacyMobileMoneyProviders(),
      ])

      const legacyMobileMoneyProviders = filterLegacyMobileMoneyProviders(
        rawLegacyMobileMoneyProviders,
        flow,
        userLocation.countryCodeAlpha2,
        tokenInfo.tokenId
      )

      return { legacyMobileMoneyProviders, cicoQuotes: cicoQuotesResponse.quotes }
    } catch (error) {
      dispatch(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    }
  }, [])

  const quotesLoading =
    asyncProviders.loading ||
    fiatConnectQuotesLoading ||
    asyncExchanges.loading ||
    selectFiatConnectQuoteLoading

  const normalizedQuotes = normalizeQuotes({
    flow,
    fiatConnectQuotes,
    cicoQuotes: asyncProviders.result?.cicoQuotes,
    tokenId,
  })

  const exchanges = asyncExchanges.result ?? []
  const legacyMobileMoneyProviders = asyncProviders.result?.legacyMobileMoneyProviders

  const anyProviders =
    normalizedQuotes.length || exchanges.length || legacyMobileMoneyProviders?.length

  const analyticsData = getProviderSelectionAnalyticsData({
    normalizedQuotes,
    legacyMobileMoneyProviders,
    usdToLocalRate,
    tokenInfo,
    centralizedExchanges: exchanges,
    transferCryptoAmount: cryptoAmount,
    cryptoType: tokenInfo.symbol,
  })

  useEffect(() => {
    if (!quotesLoading) {
      AppAnalytics.track(FiatExchangeEvents.cico_providers_fetch_quotes_result, {
        fiatType: localCurrency,
        defaultFiatType: defaultCurrency,
        ..._.omit(analyticsData, 'transferCryptoAmount'),
        ...(flow === CICOFlow.CashIn
          ? { flow, fiatAmount, cryptoAmount: undefined }
          : {
              flow,
              cryptoAmount,
              fiatAmount: undefined,
            }),
      })
    }
  }, [quotesLoading, localCurrency, defaultCurrency, analyticsData, flow, fiatAmount, cryptoAmount])

  if (quotesLoading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator testID="QuotesLoading" size="large" color={colors.accent} />
      </View>
    )
  }

  const availablePaymentMethods = normalizedQuotes.map((quote) => quote.getPaymentMethod())
  const somePaymentMethodsUnavailable = !paymentMethodSections.every((method) =>
    availablePaymentMethods.includes(method)
  )

  const supportOnPress = () => navigate(Screens.SupportContact)

  const handlePressDisclaimer = () => {
    navigate(Screens.WebViewScreen, { uri: links.funding })
  }

  const switchCurrencyOnPress = () => {
    navigate(Screens.FiatExchangeCurrencyBottomSheet, {
      flow: flow === CICOFlow.CashIn ? FiatExchangeFlow.CashIn : FiatExchangeFlow.CashOut,
    })
  }

  if (!anyProviders) {
    return (
      <View style={styles.noPaymentMethodsContainer}>
        <Text testID="NoPaymentMethods" style={styles.noPaymentMethods}>
          {t('noPaymentMethods', {
            digitalAsset: tokenInfo.symbol,
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
    <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Spacing.Thick24) }}>
      <AmountSpentInfo {...route.params} />
      {paymentMethodSections.map((paymentMethod) => (
        <PaymentMethodSection
          key={paymentMethod}
          normalizedQuotes={normalizedQuotes}
          paymentMethod={paymentMethod}
          flow={flow}
          tokenId={tokenId}
          analyticsData={analyticsData}
        />
      ))}
      {(tokenInfo.networkId === NetworkId['celo-mainnet'] ||
        tokenInfo.networkId === NetworkId['celo-alfajores']) && (
        <LegacyMobileMoneySection
          providers={legacyMobileMoneyProviders || []}
          tokenId={tokenInfo.tokenId}
          flow={flow}
          analyticsData={analyticsData}
        />
      )}
      <ExchangesSection
        exchanges={exchanges}
        selectedTokenId={tokenId}
        flow={flow}
        analyticsData={analyticsData}
      />

      {showUKCompliantVariant && (
        <View style={styles.disclaimerUKContainer}>
          <Text style={styles.disclaimerText}>{t('selectProviderScreen.disclaimerUK')}</Text>
        </View>
      )}
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

function AmountSpentInfo({ flow, tokenId, amount }: Props['route']['params']) {
  const localCurrency = useSelector(getLocalCurrencyCode)
  return (
    <View style={styles.amountSpentInfo} testID="AmountSpentInfo">
      <Text style={styles.amountSpentInfoText}>
        <Trans
          i18nKey={
            flow === CICOFlow.CashIn
              ? 'selectProviderScreen.cashIn.amountSpentInfo'
              : 'selectProviderScreen.cashOut.amountSpentInfo'
          }
        >
          {flow === CICOFlow.CashIn ? (
            <FiatAmount
              amount={amount.fiat}
              currency={localCurrency}
              testID="AmountSpentInfo/Fiat"
            />
          ) : (
            <CryptoAmount
              amount={amount.crypto}
              tokenId={tokenId}
              testID="AmountSpentInfo/Crypto"
            />
          )}
        </Trans>
      </Text>
    </View>
  )
}

function LimitedPaymentMethods({ flow }: { flow: CICOFlow }) {
  const { t } = useTranslation()
  const [isDialogVisible, setIsDialogVisible] = useState(false)

  const dismissDialog = () => {
    setIsDialogVisible(false)
  }
  const openDialog = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_providers_unavailable_selected, {
      flow,
    })
    setIsDialogVisible(true)
  }

  useEffect(() => {
    AppAnalytics.track(FiatExchangeEvents.cico_providers_unavailable_impression, {
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
  selectedTokenId,
  analyticsData,
}: {
  exchanges: ExternalExchangeProvider[]
  flow: CICOFlow
  selectedTokenId: string
  analyticsData: ProviderSelectionAnalyticsData
}) {
  const { t } = useTranslation()

  const { addFundsExchangesText: exchangesText, addFundsExchangesLink: exchangesLink } =
    useMemo(() => {
      if (flow === CICOFlow.CashIn) {
        return {
          addFundsExchangesText: SelectProviderExchangesText.DepositFrom,
          addFundsExchangesLink: SelectProviderExchangesLink.ExchangeQRScreen,
        }
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
    AppAnalytics.track(FiatExchangeEvents.cico_providers_exchanges_selected, {
      flow,
      ...analyticsData,
    })
    if (exchangesLink === SelectProviderExchangesLink.ExchangeQRScreen) {
      navigate(Screens.ExchangeQR, { flow, exchanges })
    } else {
      navigate(Screens.ExternalExchanges, {
        tokenId: selectedTokenId,
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

          {!!rightText && (
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
  tokenId,
  flow,
  analyticsData,
}: {
  providers: LegacyMobileMoneyProvider[]
  tokenId: string
  flow: CICOFlow
  analyticsData: ProviderSelectionAnalyticsData
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
      AppAnalytics.track(FiatExchangeEvents.cico_providers_section_impression, {
        flow,
        paymentMethod: PaymentMethod.MobileMoney,
        quoteCount: 1,
        providers: [provider.name],
      })
    }
  }, [])

  const goToProviderSite = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
      flow,
      paymentMethod: PaymentMethod.MobileMoney,
      provider: provider.name,
      feeCryptoAmount: undefined,
      kycRequired: false,
      isLowestFee: undefined,
      ...analyticsData,
    })
    navigateToURI(provider[tokenId === networkConfig.cusdTokenId ? 'cusd' : 'celo'].url)
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
    ...typeScale.bodyMedium,
    padding: variables.contentPadding,
    textAlign: 'center',
  },
  switchCurrency: {
    ...typeScale.labelLarge,
    color: colors.accent,
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
    ...typeScale.bodySmall,
  },
  categoryText: {
    ...typeScale.labelSemiBoldSmall,
    marginTop: 4,
  },
  linkToOtherScreen: {
    ...typeScale.labelSmall,
    color: colors.gray4,
  },
  disclaimerContainer: {
    padding: Spacing.Regular16,
  },
  disclaimerUKContainer: {
    paddingTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Regular16,
  },
  disclaimerText: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  dialog: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  contactSupport: {
    ...typeScale.labelLarge,
    color: colors.gray4,
    padding: Spacing.Smallest8,
  },
  amountSpentInfo: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.gray1,
    borderRadius: 16,
  },
  amountSpentInfoText: {
    textAlign: 'center',
    ...typeScale.labelSemiBoldXSmall,
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
})
