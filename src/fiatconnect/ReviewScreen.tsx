import {
  AccountNumber,
  CryptoType,
  FiatAccountSchema,
  QuoteResponse,
} from '@fiatconnect/fiatconnect-types'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import { CICOFlow, ProviderInfo } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'FiatConnectReviewScreen'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectReview>

export default function FiatConnectReviewScreen({ route, navigation }: Props) {
  const { t } = useTranslation()

  const {
    flow,
    cicoQuote,
    provider,
    fiatAccount,
    fiatAccountSchema,
    fiatAccountLogo,
  } = route.params

  const tokenInfo = useTokenInfoBySymbol(cicoQuote.quote.cryptoType)

  if (!tokenInfo) {
    Logger.error(TAG, `Token info not found for ${cicoQuote.quote.cryptoType}`)
    return null
  }

  return (
    <SafeAreaView style={styles.content}>
      <View>
        <Amount flow={flow} cicoQuote={cicoQuote} tokenAddress={tokenInfo.address} />
        <TransactionDetails flow={flow} cicoQuote={cicoQuote} tokenAddress={tokenInfo.address} />
        <PaymentMethod
          provider={provider}
          fiatAccount={fiatAccount}
          fiatAccountSchema={fiatAccountSchema}
          fiatAccountLogo={fiatAccountLogo}
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
}: {
  flow: CICOFlow
  cicoQuote: QuoteResponse
  tokenAddress: string
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
              value: cicoQuote.quote.cryptoAmount,
              currencyCode: cicoQuote.quote.cryptoType,
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
      {!!cicoQuote.fiatAccount.BankAccount?.fee && (
        // TODO(any): consider using FeeDrawer if we want to show fee type / frequency
        <LineItemRow
          title={t('feeEstimate')}
          amount={
            <CurrencyDisplay
              amount={{
                value: 0,
                currencyCode: cicoQuote.quote.fiatType,
                localAmount: {
                  value: cicoQuote.fiatAccount.BankAccount?.fee,
                  currencyCode: cicoQuote.quote.fiatType,
                  exchangeRate: 1,
                },
              }}
              testID="txDetails-fee"
            />
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
  fiatAccountLogo,
}: {
  provider: ProviderInfo
  fiatAccount: any
  fiatAccountSchema: FiatAccountSchema
  fiatAccountLogo?: string
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
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>{t('fiatConnectReviewScreen.paymentMethod')}</Text>
      <View style={styles.paymentMethodContainer}>
        <View style={styles.paymentMethodDetails}>
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
        {!!fiatAccountLogo && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: fiatAccountLogo }}
              style={styles.paymentImage}
              resizeMode="center"
              testID="paymentMethod-image"
            />
          </View>
        )}
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
  paymentMethodContainer: {
    flexDirection: 'row',
  },
  paymentMethodDetails: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
    marginBottom: 24,
  },
  imageContainer: {
    width: 80,
    height: 40,
  },
  paymentImage: {
    flex: 1,
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
