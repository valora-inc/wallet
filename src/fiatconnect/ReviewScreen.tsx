import { CryptoType, FiatAccountSchema, FiatAccountSchemas } from '@fiatconnect/fiatconnect-types'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { FiatAccount, StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'FiatConnectReviewScreen'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectReview>

export default function FiatConnectReviewScreen({ route, navigation }: Props) {
  const { t } = useTranslation()

  const { flow, normalizedQuote, fiatAccount } = route.params

  const tokenInfo = useTokenInfoBySymbol(normalizedQuote.getCryptoType())

  if (!tokenInfo) {
    Logger.error(TAG, `Token info not found for ${normalizedQuote.getCryptoType()}`)
    return null
  }

  return (
    <SafeAreaView style={styles.content}>
      <View>
        <ReceiveAmount
          flow={flow}
          normalizedQuote={normalizedQuote}
          tokenAddress={tokenInfo.address}
        />
        <TransactionDetails
          flow={flow}
          normalizedQuote={normalizedQuote}
          tokenAddress={tokenInfo.address}
        />
        <PaymentMethod
          normalizedQuote={normalizedQuote}
          fiatAccount={fiatAccount}
          fiatAccountSchema={normalizedQuote.getFiatAccountSchema()}
        />
      </View>
      <Button
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

          // TODO(any): submit the transfer
        }}
      />
    </SafeAreaView>
  )
}

function ReceiveAmount({
  flow,
  normalizedQuote,
  tokenAddress,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  tokenAddress: string
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
              tokenAddress={tokenAddress}
              showLocalAmount={false}
              testID="amount-crypto"
            />
          ) : (
            <CurrencyDisplay
              amount={{
                // The value here doesn't matter since the component will use `localAmount`
                value: 0,
                currencyCode: normalizedQuote.getCryptoType(),
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
  tokenAddress,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  tokenAddress: string
}) {
  if (flow === CICOFlow.CashIn) {
    // TODO: update below implementation to support CashIn
    throw new Error('Not implemented')
  }

  const { t } = useTranslation()
  let tokenDisplay: string
  switch (normalizedQuote.getCryptoType()) {
    case CryptoType.cUSD:
      tokenDisplay = t('celoDollar')
      break
    case CryptoType.cEUR:
      tokenDisplay = t('celoEuro')
      break
    default:
      tokenDisplay = t('total')
  }

  const fee = normalizedQuote.getFee()
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
            tokenAddress={tokenAddress}
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
            tokenAddress={tokenAddress}
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
              tokenAddress={tokenAddress}
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
                currencyCode: normalizedQuote.getCryptoType(),
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
              currencyCode: normalizedQuote.getCryptoType(),
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
  fiatAccount: FiatAccount
  fiatAccountSchema: FiatAccountSchema
}) {
  const { t } = useTranslation()

  // TODO(any): consider merging this with other schema specific stuff in a generic
  // type and create via a factory
  let displayText: string
  switch (fiatAccountSchema) {
    case FiatAccountSchema.AccountNumber:
      const account: FiatAccountSchemas[FiatAccountSchema.AccountNumber] = fiatAccount
      displayText = `${account.institutionName} (...${account.accountNumber.slice(-4)})`
      break
    default:
      throw new Error('Unsupported schema type')
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>{t('fiatConnectReviewScreen.paymentMethod')}</Text>
      <View style={styles.sectionMainTextContainer}>
        <Text style={styles.sectionMainText} testID="paymentMethod-text">
          {displayText}
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
