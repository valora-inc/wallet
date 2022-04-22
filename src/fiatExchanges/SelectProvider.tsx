import React, { useState } from 'react'
import {
  LayoutAnimation,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import Touchable from 'src/components/Touchable'
import BackButton from 'src/components/BackButton'
import Expandable from 'src/components/Expandable'
import { emptyHeader } from 'src/navigator/Headers'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import {
  fetchProviders,
  ProviderQuote,
  sortQuotes,
  isSimplexQuote,
  getQuotes,
  CicoQuote,
  getFeeValueFromQuotes,
  SimplexQuote,
  PaymentMethod,
  fetchLocalCicoProviders,
  getAvailableLocalProviders,
  LocalCicoProvider,
  CICOFlow,
} from './utils'
import { StackScreenProps } from '@react-navigation/stack'
import { StackParamList } from 'src/navigator/types'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'react-redux'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { currentAccountSelector } from 'src/web3/selectors'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { useAsync } from 'react-async-hook'
import Logger from 'src/utils/Logger'
import { showError } from 'src/alert/actions'
import variables from 'src/styles/variables'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { useTranslation } from 'react-i18next'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { navigate } from 'src/navigator/NavigationService'
import { navigateToURI } from 'src/utils/linking'
import Dialog from 'src/components/Dialog'
import i18n from 'src/i18n'
import { RouteProp } from '@react-navigation/native'

const TAG = 'SelectProviderScreen'

type Props = StackScreenProps<StackParamList, Screens.SelectProvider>

export default function SelectProviderScreen({ route, navigation }: Props) {
  const dispatch = useDispatch()
  const userLocation = useSelector(userLocationDataSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const [noPaymentMethods, setNoPaymentMethods] = useState(false)
  const { flow } = route.params

  const currencyToBuy = {
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
        digitalAsset: currencyToBuy,
        fiatAmount: route.params.amount.fiat,
        digitalAssetAmount: route.params.amount.crypto,
        txType: flow === CICOFlow.CashIn ? 'buy' : 'sell',
      })

      const localProviders = await fetchLocalCicoProviders()
      const availableLocalProviders = getAvailableLocalProviders(
        localProviders,
        flow,
        userLocation.countryCodeAlpha2,
        currencyToBuy
      )

      return { providers, availableLocalProviders }
    } catch (error) {
      dispatch(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    }
  }, [])

  const quoteOnPress = ({ quote, provider }: CicoQuote) => () => {
    ValoraAnalytics.track(FiatExchangeEvents.provider_chosen, {
      flow,
      provider: provider.name,
    })

    if (quote && userLocation?.ipAddress && isSimplexQuote(quote)) {
      navigate(Screens.Simplex, {
        simplexQuote: quote,
        userIpAddress: userLocation.ipAddress,
      })
      return
    }

    ;(quote as ProviderQuote).url && navigateToURI((quote as ProviderQuote).url)
  }

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
      .sort(sortQuotes) || []
  return (
    <ScrollView>
      <PaymentMethodSection
        cicoQuotes={cicoQuotes}
        paymentMethod={PaymentMethod.Card}
        setNoPaymentMethods={setNoPaymentMethods}
        quoteOnPress={quoteOnPress}
      />
      <PaymentMethodSection
        cicoQuotes={cicoQuotes}
        paymentMethod={PaymentMethod.Bank}
        setNoPaymentMethods={setNoPaymentMethods}
        quoteOnPress={quoteOnPress}
      />
      <LocalProviderMobileMoneySection
        localProvider={asyncProviders.result?.availableLocalProviders[0]}
        digitalAsset={currencyToBuy}
      />
      <ExchangesSection selectedCurrency={route.params.selectedCrypto} flow={flow} />
      <LimitedPaymentMethods visible={noPaymentMethods} />
    </ScrollView>
  )
}

function LimitedPaymentMethods({ visible }: { visible: boolean }) {
  const { t } = useTranslation()
  const [isDialogVisible, setIsDialogVisible] = useState(false)
  const dismissDialog = () => {
    setIsDialogVisible(false)
  }
  const openDialog = () => {
    setIsDialogVisible(true)
  }
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
    navigate(Screens.ExternalExchanges, {
      currency: selectedCurrency,
      isCashIn: flow === CICOFlow.CashIn,
    })
  }
  return (
    <View style={styles.container}>
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

function LocalProviderMobileMoneySection({
  localProvider,
  digitalAsset,
}: {
  localProvider: LocalCicoProvider | undefined
  digitalAsset: CiCoCurrency
}) {
  const { t } = useTranslation()
  if (!localProvider) {
    return null
  }
  const goToLocalProvider = () => {
    navigateToURI(localProvider[digitalAsset === CiCoCurrency.CUSD ? 'cusd' : 'celo'].url)
  }
  return (
    <View style={styles.container}>
      <Touchable onPress={goToLocalProvider}>
        <View style={{ ...styles.expandableContainer, paddingVertical: 27 }}>
          <View style={styles.left}>
            <Text style={styles.category}>{t('selectProviderScreen.mobileMoney')}</Text>
            <Text style={styles.fee}>{t('selectProviderScreen.feesVary')}</Text>
          </View>

          <View style={styles.right}>
            <Text style={styles.linkToOtherScreen}>{localProvider.name}</Text>
          </View>
        </View>
      </Touchable>
    </View>
  )
}

interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod
  cicoQuotes: CicoQuote[]
  setNoPaymentMethods: React.Dispatch<React.SetStateAction<boolean>>
  quoteOnPress: (cicoQuote: CicoQuote) => void
}

export function PaymentMethodSection({
  paymentMethod,
  cicoQuotes,
  setNoPaymentMethods,
  quoteOnPress,
}: PaymentMethodSectionProps) {
  const { t } = useTranslation()
  const sectionQuotes = cicoQuotes.filter(({ quote }) => quote.paymentMethod === paymentMethod)
  const localCurrency = useSelector(getLocalCurrencyCode)

  const isExpandable = sectionQuotes.length > 1
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }
  if (!sectionQuotes.length) {
    setNoPaymentMethods(true)
    return null
  }
  const renderFeeAmount = (quote: SimplexQuote | ProviderQuote, postFix: string) => {
    const feeAmount = getFeeValueFromQuotes(quote)

    if (feeAmount === undefined) {
      return null
    }

    return (
      <Text>
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
          style={styles.fee}
        />{' '}
        {postFix}
      </Text>
    )
  }
  return (
    <View style={styles.container}>
      <Touchable
        onPress={
          isExpandable
            ? toggleExpanded
            : ((quoteOnPress(sectionQuotes[0]) as unknown) as () => void)
        }
      >
        <View>
          <Expandable
            arrowColor={colors.greenUI}
            containerStyle={{
              ...styles.expandableContainer,
              paddingVertical: isExpandable ? (expanded ? 22 : 27) : 16,
            }}
            isExpandable={isExpandable}
            isExpanded={expanded}
          >
            {isExpandable ? (
              <>
                <View style={styles.left}>
                  <Text style={styles.category}>
                    {paymentMethod === PaymentMethod.Card
                      ? t('selectProviderScreen.card')
                      : t('selectProviderScreen.bank')}
                  </Text>
                  {!expanded && (
                    <Text style={styles.fee}>
                      {renderFeeAmount(sectionQuotes[0].quote, t('selectProviderScreen.minFee'))}
                    </Text>
                  )}
                </View>

                <View style={styles.right}>
                  <Text style={styles.providerDropdown}>
                    {t('selectProviderScreen.numProviders', { count: sectionQuotes.length })}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.left}>
                  <Text style={styles.category}>
                    {paymentMethod === PaymentMethod.Card
                      ? t('selectProviderScreen.card')
                      : t('selectProviderScreen.bank')}
                  </Text>
                  <Text style={styles.fee}>
                    {renderFeeAmount(sectionQuotes[0].quote, t('selectProviderScreen.fee'))}
                  </Text>
                  <Text style={styles.topInfo}>
                    {t('selectProviderScreen.idRequired')} |{' '}
                    {paymentMethod === PaymentMethod.Card
                      ? t('selectProviderScreen.oneHour')
                      : t('selectProviderScreen.numDays')}
                  </Text>
                </View>

                <View style={styles.imageContainer}>
                  <Image
                    testID={`image-${sectionQuotes[0].provider.name}`}
                    source={{ uri: sectionQuotes[0].provider.logoWide }}
                    style={styles.providerImage}
                    resizeMode="center"
                  />
                </View>
              </>
            )}
          </Expandable>
        </View>
      </Touchable>
      {expanded &&
        sectionQuotes.map((cicoQuote, index) => (
          <Touchable onPress={(quoteOnPress(cicoQuote) as unknown) as () => void}>
            <View style={styles.expandedContainer}>
              <View style={styles.left}>
                <Text style={styles.expandedFee}>
                  {renderFeeAmount(cicoQuote.quote, t('selectProviderScreen.fee'))}
                </Text>
                <Text style={styles.expandedInfo}>
                  {t('selectProviderScreen.idRequired')} |{' '}
                  {paymentMethod === PaymentMethod.Card
                    ? t('selectProviderScreen.oneHour')
                    : t('selectProviderScreen.numDays')}
                </Text>
                {index === 0 && (
                  <Text style={styles.expandedTag}>{t('selectProviderScreen.bestRate')}</Text>
                )}
              </View>

              <View style={styles.imageContainer}>
                <Image
                  testID={`image-${cicoQuote.provider.name}`}
                  source={{ uri: cicoQuote.provider.logoWide }}
                  style={styles.providerImage}
                  resizeMode="center"
                />
              </View>
            </View>
          </Touchable>
        ))}
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
  expandedContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFA',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  providerImage: {
    flex: 1,
  },
  imageContainer: {
    width: 80,
    height: 40,
  },
  category: {
    ...fontStyles.small500,
  },
  fee: {
    ...fontStyles.regular500,
    marginTop: 4,
  },
  providerDropdown: {
    ...fontStyles.small500,
    color: colors.greenUI,
  },
  expandedInfo: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 2,
  },
  topInfo: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 4,
  },
  expandedFee: {
    ...fontStyles.regular500,
  },
  expandedTag: {
    ...fontStyles.label,
    color: colors.greenUI,
    fontSize: 12,
    marginTop: 2,
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
  headerLeft: () => <BackButton />,
  headerTitle: i18n.t(`fiatExchangeFlow.${route.params.flow}.selectProviderHeader`),
})
