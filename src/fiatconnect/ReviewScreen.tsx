import {
  AccountNumber,
  CryptoType,
  FiatAccountSchema,
  FiatAccountType,
  QuoteResponse,
} from '@fiatconnect/fiatconnect-types'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import { CICOFlow, ProviderInfo } from 'src/fiatExchanges/utils'
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

  const { flow, cicoQuote, provider, fiatAccount, fiatAccountSchema } = route.params

  const tokenInfo = useTokenInfoBySymbol(cicoQuote.quote.cryptoType)

  if (!tokenInfo) {
    Logger.error(TAG, `Token info not found for ${cicoQuote.quote.cryptoType}`)
    return null
  }

  return (
    <SafeAreaView style={styles.content}>
      <View>
        <Amount flow={flow} cicoQuote={cicoQuote} tokenAddress={tokenInfo.address} />
        <TransactionDetails
          flow={flow}
          cicoQuote={cicoQuote}
          tokenAddress={tokenInfo.address}
          fiatAccountType={fiatAccount.fiatAccountType}
        />
        <PaymentMethod
          provider={provider}
          fiatAccount={fiatAccount}
          fiatAccountSchema={fiatAccountSchema}
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
          Logger.debug(TAG, 'Button clicked')

          // TODO(any): submit the transfer
        }}
      />
    </SafeAreaView>
  )
}

function Amount({
  flow,
  cicoQuote,
  tokenAddress,
}: {
  flow: CICOFlow
  cicoQuote: QuoteResponse
  tokenAddress: string
}) {
  return (
    <View style={styles.amountContainer}>
      {flow === CICOFlow.CashIn ? (
        <TokenDisplay
          amount={cicoQuote.quote.cryptoAmount}
          tokenAddress={tokenAddress}
          style={styles.amountText}
          showLocalAmount={false}
          testID="amount-crypto"
        />
      ) : (
        <CurrencyDisplay
          style={styles.amountText}
          amount={{
            value: cicoQuote.quote.cryptoAmount,
            currencyCode: cicoQuote.quote.cryptoType,
            localAmount: {
              value: cicoQuote.quote.fiatAmount,
              currencyCode: cicoQuote.quote.fiatType,
              exchangeRate: 1,
            },
          }}
          testID="amount-fiat"
        />
      )}
    </View>
  )
}

function TransactionDetails({
  flow,
  cicoQuote,
  tokenAddress,
  fiatAccountType,
}: {
  flow: CICOFlow
  cicoQuote: QuoteResponse
  tokenAddress: string
  fiatAccountType: FiatAccountType
}) {
  const { t } = useTranslation()
  let tokenDisplay: string
  switch (cicoQuote.quote.cryptoType) {
    case CryptoType.cUSD:
      tokenDisplay = t('celoDollar')
      break
    case CryptoType.cEUR:
      tokenDisplay = t('celoEuro')
      break
    default:
      tokenDisplay = t('total')
  }

  // TODO(satish): update amount / fee based on final designs
  const fee = cicoQuote.fiatAccount[fiatAccountType]?.fee

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>
        {t('fiatConnectReviewScreen.transactionDetails')}
      </Text>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={
          flow === CICOFlow.CashIn
            ? t('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')
            : t('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')
        }
        amount={
          <CurrencyDisplay
            amount={{
              // NOTE: since local amount is set, those would be displayed
              // directly instead of the outer value / currency below which are
              // ignored
              value: 0,
              currencyCode: cicoQuote.quote.fiatType,
              localAmount: {
                value: cicoQuote.quote.fiatAmount,
                currencyCode: cicoQuote.quote.fiatType,
                exchangeRate: 1,
              },
            }}
            testID="txDetails-fiat"
          />
        }
      />
      <LineItemRow
        title={
          <>
            {`${tokenDisplay} @ `}
            <CurrencyDisplay
              amount={{ value: new BigNumber('1'), currencyCode: cicoQuote.quote.cryptoType }}
              showLocalAmount={true}
            />
          </>
        }
        amount={
          <TokenDisplay
            amount={cicoQuote.quote.cryptoAmount}
            tokenAddress={tokenAddress}
            showLocalAmount={false}
            testID="txDetails-crypto"
          />
        }
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
      />
      {!!fee && (
        // TODO(any): consider using FeeDrawer if we want to show fee type / frequency
        <LineItemRow
          title={t('feeEstimate')}
          amount={
            flow === CICOFlow.CashIn ? (
              <CurrencyDisplay
                amount={{
                  value: 0,
                  currencyCode: cicoQuote.quote.fiatType,
                  localAmount: {
                    value: fee,
                    currencyCode: cicoQuote.quote.fiatType,
                    exchangeRate: 1,
                  },
                }}
                testID="txDetails-fee"
              />
            ) : (
              <TokenDisplay
                amount={fee}
                tokenAddress={tokenAddress}
                showLocalAmount={false}
                testID="txDetails-fee"
              />
            )
          }
          style={styles.sectionSubTextContainer}
          textStyle={styles.sectionSubText}
        />
      )}
    </View>
  )
}

function PaymentMethod({
  provider,
  fiatAccount,
  fiatAccountSchema,
}: {
  provider: ProviderInfo
  fiatAccount: FiatAccount
  fiatAccountSchema: FiatAccountSchema
}) {
  const { t } = useTranslation()

  // TODO(any): consider merging this with other schema specific stuff in a generic
  // type and create via a factory
  let displayText: string
  switch (fiatAccountSchema) {
    case FiatAccountSchema.AccountNumber:
      const account: AccountNumber = fiatAccount
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
          {t('fiatConnectReviewScreen.paymentMethodVia', { providerName: provider.name })}
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
  amountContainer: {
    paddingVertical: 32,
  },
  amountText: {
    ...fontStyles.largeNumber,
    textAlign: 'center',
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
})

FiatConnectReviewScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectReview>
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  headerTitle:
    // NOTE: copies for cash in not final
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatConnectReviewScreen.cashIn.header`)
      : i18n.t(`fiatConnectReviewScreen.cashOut.header`),
})
