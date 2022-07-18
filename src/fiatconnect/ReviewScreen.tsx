import { FiatAccountSchema, ObfuscatedFiatAccountData } from '@fiatconnect/fiatconnect-types'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import { startFiatConnectTransfer } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency, resolveCICOCurrency } from 'src/utils/currencies'
import { navigate } from 'src/navigator/NavigationService'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectReview>

export default function FiatConnectReviewScreen({ route, navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow, normalizedQuote, fiatAccount } = route.params

  return (
    <SafeAreaView style={styles.content}>
      <View>
        <ReceiveAmount flow={flow} normalizedQuote={normalizedQuote} />
        <TransactionDetails flow={flow} normalizedQuote={normalizedQuote} />
        <PaymentMethod
          normalizedQuote={normalizedQuote}
          fiatAccount={fiatAccount}
          fiatAccountSchema={normalizedQuote.getFiatAccountSchema()}
        />
      </View>
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
          ValoraAnalytics.track(FiatExchangeEvents.cico_submit_transfer, { flow })

          dispatch(
            startFiatConnectTransfer({
              flow,
              fiatConnectQuote: normalizedQuote,
              quoteId: normalizedQuote.getQuoteId(),
              fiatAccountId: fiatAccount.fiatAccountId,
            })
          )

          navigate(Screens.FiatConnectTransferStatus, {
            flow,
            normalizedQuote,
            fiatAccount,
          })
        }}
      />
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
  return (
    <View style={styles.receiveAmountContainer}>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={t('fiatConnectReviewScreen.receiveAmount')}
        amount={
          flow === CICOFlow.CashIn ? (
            <TokenDisplay
              amount={normalizedQuote.getCryptoAmount()}
              currency={normalizedQuote.getCryptoType()}
              showLocalAmount={false}
              testID="amount-crypto"
            />
          ) : (
            <CurrencyDisplay
              amount={{
                // The value here doesn't matter since the component will use `localAmount`
                value: 0,
                currencyCode: resolveCICOCurrency(normalizedQuote.getCryptoType()),
                localAmount: {
                  value: normalizedQuote.getFiatAmount(),
                  currencyCode: normalizedQuote.getFiatType(),
                  exchangeRate: 1,
                },
              }}
              testID="amount-fiat"
            />
          )
        }
      />
    </View>
  )
}

function TransactionDetails({
  flow,
  normalizedQuote,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
}) {
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)!

  if (flow === CICOFlow.CashIn) {
    // TODO: update below implementation to support CashIn
    throw new Error('Not implemented')
  }

  const { t } = useTranslation()
  let tokenDisplay: string
  switch (normalizedQuote.getCryptoType()) {
    case Currency.Dollar:
      tokenDisplay = t('celoDollar')
      break
    case Currency.Euro:
      tokenDisplay = t('celoEuro')
      break
    default:
      tokenDisplay = t('total')
  }

  const fee = normalizedQuote.getFeeInCrypto(exchangeRates)
  const totalConverted = Number(normalizedQuote.getCryptoAmount()) - Number(fee || 0)
  const exchangeRate = Number(normalizedQuote.getFiatAmount()) / totalConverted

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>
        {t('fiatConnectReviewScreen.transactionDetails')}
      </Text>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={t('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')}
        amount={
          <TokenDisplay
            amount={normalizedQuote.getCryptoAmount()}
            currency={normalizedQuote.getCryptoType()}
            showLocalAmount={false}
            testID="txDetails-total"
          />
        }
      />
      <LineItemRow
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
        title={t('fiatConnectReviewScreen.cashOut.transactionDetailsAmountConverted')}
        amount={
          <TokenDisplay
            amount={totalConverted}
            currency={normalizedQuote.getCryptoType()}
            showLocalAmount={false}
            testID="txDetails-converted"
          />
        }
      />
      {!!fee && (
        // TODO(any): consider using FeeDrawer if we want to show fee breakdown
        <LineItemRow
          title={t('feeEstimate')}
          amount={
            <TokenDisplay
              amount={fee}
              currency={normalizedQuote.getCryptoType()}
              showLocalAmount={false}
              testID="txDetails-fee"
            />
          }
          style={styles.sectionSubTextContainer}
          textStyle={styles.sectionSubText}
        />
      )}
      <LineItemRow
        title={
          <>
            {`${tokenDisplay} @ `}
            <CurrencyDisplay
              amount={{
                value: 1,
                currencyCode: resolveCICOCurrency(normalizedQuote.getCryptoType()),
                localAmount: {
                  value: exchangeRate,
                  currencyCode: normalizedQuote.getFiatType(),
                  exchangeRate,
                },
              }}
              formatType={FormatType.ExchangeRate}
              testID="txDetails-exchangeRate"
            />
          </>
        }
        amount={
          <CurrencyDisplay
            amount={{
              // The value here doesn't matter since the component will use `localAmount`
              value: 0,
              currencyCode: resolveCICOCurrency(normalizedQuote.getCryptoType()),
              localAmount: {
                value: normalizedQuote.getFiatAmount(),
                currencyCode: normalizedQuote.getFiatType(),
                exchangeRate: 1,
              },
            }}
            testID="txDetails-exchangeAmount"
          />
        }
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
      />
    </View>
  )
}

function PaymentMethod({
  normalizedQuote,
  fiatAccount,
  fiatAccountSchema,
}: {
  normalizedQuote: FiatConnectQuote
  fiatAccount: ObfuscatedFiatAccountData
  fiatAccountSchema: FiatAccountSchema
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>{t('fiatConnectReviewScreen.paymentMethod')}</Text>
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
})

FiatConnectReviewScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectReview>
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  // NOTE: copies for cash in not final
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatConnectReviewScreen.cashIn.header`)
      : i18n.t(`fiatConnectReviewScreen.cashOut.header`),
  // TODO(any): when tying this component to the flow, add `onCancel` prop to
  // navigate to correct screen.
  headerRight: () => <CancelButton style={styles.cancelBtn} />,
})
