import { ObfuscatedFiatAccountData } from '@fiatconnect/fiatconnect-types'
import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, BackHandler, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { convertToFiatConnectFiatCurrency } from 'src/fiatconnect'
import { CURRENCIES_WITH_FEE_DISCLAIMER } from 'src/fiatconnect/constants'
import {
  fiatConnectQuotesErrorSelector,
  fiatConnectQuotesLoadingSelector,
} from 'src/fiatconnect/selectors'
import { createFiatConnectTransfer, refetchQuote } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  getDefaultLocalCurrencyCode,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'

type Props = NativeStackScreenProps<StackParamList, Screens.FiatConnectReview>

const disclaimerIsNeeded = (
  flow: CICOFlow,
  quote: FiatConnectQuote,
  localCurrency: LocalCurrencyCode
) => {
  const fiatType = quote.getFiatType()
  const currencyEligibleForDisclaimer =
    !!CURRENCIES_WITH_FEE_DISCLAIMER[quote.getFiatAccountSchema()]?.has(localCurrency)
  return (
    flow === CICOFlow.CashOut &&
    fiatType !== convertToFiatConnectFiatCurrency(localCurrency) &&
    currencyEligibleForDisclaimer
  )
}

export default function FiatConnectReviewScreen({ route, navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow, normalizedQuote, fiatAccount, shouldRefetchQuote } = route.params
  const fiatConnectQuotesLoading = useSelector(fiatConnectQuotesLoadingSelector)
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)
  const localCurrency = useSelector(getDefaultLocalCurrencyCode)
  const [showingExpiredQuoteDialog, setShowingExpiredQuoteDialog] = useState(
    normalizedQuote.getGuaranteedUntil() < new Date()
  )
  const showFeeDisclaimer = useMemo(
    () => disclaimerIsNeeded(flow, normalizedQuote, localCurrency),
    []
  )

  useEffect(() => {
    if (shouldRefetchQuote) {
      dispatch(
        refetchQuote({
          flow,
          cryptoType: normalizedQuote.getCryptoType(),
          cryptoAmount: normalizedQuote.getCryptoAmount(),
          fiatAmount: normalizedQuote.getFiatAmount(),
          providerId: normalizedQuote.getProviderId(),
          fiatAccount,
        })
      )
    }
  }, [shouldRefetchQuote])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton testID="backButton" onPress={onPressBack} />,
    })
  }, [navigation])

  useEffect(() => {
    function hardwareBackPress() {
      goBack()
      return true
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', hardwareBackPress)
    return function cleanup() {
      backHandler.remove()
    }
  }, [])

  const goBack = () => {
    // Navigate Back unless the previous screen was FiatDetailsScreen
    const routes = navigation.getState().routes
    const previousScreen = routes[routes.length - 2]
    if (previousScreen?.name === Screens.FiatDetailsScreen) {
      navigate(Screens.SelectProvider, {
        flow: normalizedQuote.flow,
        selectedCrypto: normalizedQuote.getCryptoType(),
        amount: {
          fiat: parseFloat(normalizedQuote.getFiatAmount()),
          crypto: parseFloat(normalizedQuote.getCryptoAmount()),
        },
      })
    } else if (previousScreen?.name === Screens.FiatConnectRefetchQuote) {
      navigate(Screens.FiatExchange)
    } else {
      navigateBack()
    }
  }

  const onPressBack = async () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_review_back, {
      flow,
      provider: normalizedQuote.getProviderId(),
    })
    goBack()
  }

  const onPressSupport = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_review_error_contact_support, {
      flow,
      provider: normalizedQuote.getProviderId(),
    })
    navigate(Screens.SupportContact)
  }

  const onPressTryAgain = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_review_error_retry, {
      flow,
      provider: normalizedQuote.getProviderId(),
    })
    dispatch(
      refetchQuote({
        flow,
        cryptoType: normalizedQuote.getCryptoType(),
        cryptoAmount: normalizedQuote.getCryptoAmount(),
        fiatAmount: normalizedQuote.getFiatAmount(),
        providerId: normalizedQuote.getProviderId(),
        fiatAccount,
      })
    )
  }

  if (fiatConnectQuotesError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('fiatConnectReviewScreen.failedRefetch.title')}</Text>
        <Text style={styles.description}>
          {t('fiatConnectReviewScreen.failedRefetch.description')}
        </Text>
        <Button
          style={styles.button}
          testID="TryAgain"
          onPress={onPressTryAgain}
          text={t('fiatConnectReviewScreen.failedRefetch.tryAgain')}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.MEDIUM}
        />
        <Button
          style={styles.button}
          testID="SupportContactLink"
          onPress={onPressSupport}
          text={t('contactSupport')}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.MEDIUM}
        />
      </View>
    )
  }

  if (fiatConnectQuotesLoading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.content}>
      <Dialog
        testID="expiredQuoteDialog"
        isVisible={showingExpiredQuoteDialog}
        title={t('fiatConnectReviewScreen.quoteExpiredDialog.title')}
        actionText={t('fiatConnectReviewScreen.quoteExpiredDialog.continue')}
        actionPress={() => {
          dispatch(
            refetchQuote({
              flow,
              cryptoType: normalizedQuote.getCryptoType(),
              cryptoAmount: normalizedQuote.getCryptoAmount(),
              fiatAmount: normalizedQuote.getFiatAmount(),
              providerId: normalizedQuote.getProviderId(),
              fiatAccount,
            })
          )
          setShowingExpiredQuoteDialog(false)
        }}
      >
        {t('fiatConnectReviewScreen.quoteExpiredDialog.body')}
      </Dialog>
      <View>
        <ReceiveAmount flow={flow} normalizedQuote={normalizedQuote} />
        <TransactionDetails flow={flow} normalizedQuote={normalizedQuote} />
        <PaymentMethod flow={flow} normalizedQuote={normalizedQuote} fiatAccount={fiatAccount} />
      </View>
      <View>
        {showFeeDisclaimer && (
          <Text style={styles.disclaimer}>{t('fiatConnectReviewScreen.feeDisclaimer')}</Text>
        )}
        <Button
          testID="submitButton"
          style={styles.submitBtn}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          text={
            flow === CICOFlow.CashIn
              ? t('fiatConnectReviewScreen.cashIn.button')
              : t('fiatConnectReviewScreen.cashOut.button')
          }
          onPress={() => {
            if (normalizedQuote.getGuaranteedUntil() < new Date()) {
              setShowingExpiredQuoteDialog(true)
            } else {
              ValoraAnalytics.track(FiatExchangeEvents.cico_fc_review_submit, {
                flow,
                provider: normalizedQuote.getProviderId(),
              })

              dispatch(
                createFiatConnectTransfer({
                  flow,
                  fiatConnectQuote: normalizedQuote,
                  fiatAccountId: fiatAccount.fiatAccountId,
                })
              )

              navigate(Screens.FiatConnectTransferStatus, {
                flow,
                normalizedQuote,
                fiatAccount,
              })
            }
          }}
        />
      </View>
    </SafeAreaView>
  )
}

function ReceiveAmount({
  flow,
  normalizedQuote,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
}) {
  const { t } = useTranslation()
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)!

  const { receiveDisplay } = getDisplayAmounts({
    flow,
    normalizedQuote,
    exchangeRates,
  })
  return (
    <View style={styles.receiveAmountContainer}>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={t('fiatConnectReviewScreen.receiveAmount')}
        amount={receiveDisplay('receive-amount')}
      />
    </View>
  )
}

function CryptoAmount({
  amount,
  currency,
  testID,
}: {
  amount: BigNumber.Value
  currency: Currency
  testID: string
}) {
  return (
    <TokenDisplay amount={amount} currency={currency} showLocalAmount={false} testID={testID} />
  )
}

function FiatAmount({
  amount,
  currency,
  testID,
  formatType,
}: {
  amount: BigNumber.Value
  currency: string
  testID: string
  formatType?: FormatType
}) {
  return (
    <CurrencyDisplay
      amount={{
        // The value and currencyCode here doesn't matter since the component will use `localAmount`
        value: 0,
        currencyCode: '',
        localAmount: {
          value: amount,
          currencyCode: currency,
          exchangeRate: 1,
        },
      }}
      formatType={formatType}
      testID={testID}
    />
  )
}

function getDisplayAmounts({
  flow,
  normalizedQuote,
  exchangeRates,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  exchangeRates: {
    cGLD: string | null
    cUSD: string | null
    cEUR: string | null
  }
}) {
  const cryptoType = normalizedQuote.getCryptoType()
  const fiatType = normalizedQuote.getFiatType()
  if (flow === CICOFlow.CashOut) {
    const receive = normalizedQuote.getFiatAmount()
    const total = normalizedQuote.getCryptoAmount()
    const fee = normalizedQuote.getFeeInCrypto(exchangeRates)
    const totalMinusFee = Number(total) - Number(fee || 0)
    const exchangeRate = Number(receive) / totalMinusFee

    const receiveDisplay = (testID: string) => (
      <FiatAmount amount={receive} currency={fiatType} testID={testID} />
    )
    const totalDisplay = (
      <CryptoAmount amount={total} currency={cryptoType} testID="txDetails-total" />
    )

    const feeDisplay = fee && (
      <CryptoAmount amount={fee} currency={cryptoType} testID="txDetails-fee" />
    )

    const totalMinusFeeDisplay = (
      <CryptoAmount amount={totalMinusFee} currency={cryptoType} testID="txDetails-converted" />
    )
    const exchangeRateDisplay = (
      <FiatAmount
        amount={exchangeRate}
        currency={fiatType}
        testID="txDetails-exchangeRate"
        formatType={FormatType.ExchangeRate}
      />
    )
    return {
      receiveDisplay,
      totalDisplay,
      feeDisplay,
      totalMinusFeeDisplay,
      exchangeRateDisplay,
    }
  } else {
    const receive = normalizedQuote.getCryptoAmount()
    const total = normalizedQuote.getFiatAmount()
    const fee = normalizedQuote.getFeeInFiat(exchangeRates)
    const totalMinusFee = Number(total) - Number(fee || 0)
    const exchangeRate = totalMinusFee / Number(receive)

    const receiveDisplay = (testID: string) => (
      <CryptoAmount amount={receive} currency={cryptoType} testID={testID} />
    )
    const totalDisplay = <FiatAmount amount={total} currency={fiatType} testID="txDetails-total" />

    const feeDisplay = fee && <FiatAmount amount={fee} currency={fiatType} testID="txDetails-fee" />

    const totalMinusFeeDisplay = (
      <FiatAmount amount={totalMinusFee} currency={fiatType} testID="txDetails-converted" />
    )
    const exchangeRateDisplay = (
      <FiatAmount
        amount={exchangeRate}
        currency={fiatType}
        testID="txDetails-exchangeRate"
        formatType={FormatType.ExchangeRate}
      />
    )
    return {
      receiveDisplay,
      totalDisplay,
      feeDisplay,
      totalMinusFeeDisplay,
      exchangeRateDisplay,
    }
  }
}

function TransactionDetails({
  flow,
  normalizedQuote,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
}) {
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)!
  const { receiveDisplay, totalDisplay, feeDisplay, exchangeRateDisplay, totalMinusFeeDisplay } =
    getDisplayAmounts({
      flow,
      normalizedQuote,
      exchangeRates,
    })
  const { t } = useTranslation()
  let tokenDisplay: string
  switch (normalizedQuote.getCryptoType()) {
    case Currency.Dollar:
      tokenDisplay = t('celoDollar')
      break
    case Currency.Euro:
      tokenDisplay = t('celoEuro')
      break
    case Currency.Celo:
      tokenDisplay = 'CELO'
      break
    default:
      tokenDisplay = t('total')
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>
        {t('fiatConnectReviewScreen.transactionDetails')}
      </Text>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={
          flow === CICOFlow.CashOut
            ? t('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')
            : t('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')
        }
        amount={totalDisplay}
      />
      <LineItemRow
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
        title={
          flow === CICOFlow.CashOut
            ? t('fiatConnectReviewScreen.cashOut.transactionDetailsAmountConverted')
            : t('fiatConnectReviewScreen.cashIn.transactionDetailsAmountConverted')
        }
        amount={totalMinusFeeDisplay}
      />
      {!!feeDisplay && (
        // TODO(any): consider using FeeDrawer if we want to show fee breakdown
        <LineItemRow
          title={t('feeEstimate')}
          amount={feeDisplay}
          style={styles.sectionSubTextContainer}
          textStyle={styles.sectionSubText}
        />
      )}
      <LineItemRow
        title={
          <>
            {`${tokenDisplay} @ `}
            {exchangeRateDisplay}
          </>
        }
        amount={receiveDisplay('txDetails-receive')}
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
      />
    </View>
  )
}

function PaymentMethod({
  flow,
  normalizedQuote,
  fiatAccount,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  fiatAccount: ObfuscatedFiatAccountData
}) {
  const { t } = useTranslation()

  const onPress = () => {
    navigate(Screens.SelectProvider, {
      flow: normalizedQuote.flow,
      selectedCrypto: normalizedQuote.getCryptoType(),
      amount: {
        fiat: parseFloat(normalizedQuote.getFiatAmount()),
        crypto: parseFloat(normalizedQuote.getCryptoAmount()),
      },
    })
  }

  return (
    <Touchable onPress={onPress}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderText}>
          {flow === CICOFlow.CashIn
            ? t('fiatConnectReviewScreen.cashIn.paymentMethodHeader')
            : t('fiatConnectReviewScreen.cashOut.paymentMethodHeader')}
        </Text>
        <View style={styles.sectionMainTextContainer}>
          <Text style={styles.sectionMainText} testID="paymentMethod-text">
            {fiatAccount.accountName}
          </Text>
        </View>
        <View style={styles.sectionSubTextContainer}>
          <Text style={styles.sectionSubText} testID="paymentMethod-via">
            {t('fiatConnectReviewScreen.paymentMethodVia', {
              providerName: normalizedQuote.getProviderName(),
            })}
          </Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  receiveAmountContainer: {
    marginHorizontal: variables.contentPadding,
    paddingVertical: 24,
  },
  sectionContainer: {
    marginHorizontal: variables.contentPadding,
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    paddingVertical: 24,
  },
  sectionHeaderText: {
    ...fontStyles.label,
    color: colors.gray3,
    marginBottom: 8,
  },
  sectionMainTextContainer: {
    marginVertical: 0,
  },
  sectionMainText: {
    ...fontStyles.regular500,
  },
  sectionSubTextContainer: {
    marginVertical: 2,
  },
  sectionSubText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  submitBtn: {
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
    marginBottom: 24,
  },
  cancelBtn: {
    color: colors.gray3,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 48,
    paddingBottom: 24,
  },
  button: {
    marginTop: 13,
  },
  disclaimer: {
    ...fontStyles.small,
    paddingHorizontal: variables.contentPadding,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.gray4,
  },
})

FiatConnectReviewScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectReview>
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatConnectReviewScreen.cashIn.header`)
      : i18n.t(`fiatConnectReviewScreen.cashOut.header`),
  headerRight: () => (
    <CancelButton
      onCancel={() => {
        ValoraAnalytics.track(FiatExchangeEvents.cico_fc_review_cancel, {
          flow: route.params.flow,
          provider: route.params.normalizedQuote.getProviderId(),
        })
        navigate(Screens.FiatExchange)
      }}
      style={styles.cancelBtn}
    />
  ),
})
