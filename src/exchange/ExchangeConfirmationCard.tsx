import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import HorizontalLine from 'src/components/HorizontalLine'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import fontStyles from 'src/styles/fonts'
import { Currency } from 'src/utils/currencies'

export interface ExchangeConfirmationCardProps {
  makerAmount: MoneyAmount
  takerAmount: MoneyAmount
}

type Props = ExchangeConfirmationCardProps

export default function ExchangeConfirmationCard(props: Props) {
  const { t } = useTranslation()
  const { makerAmount, takerAmount } = props
  const isSellGoldTx = makerAmount.currencyCode === Currency.Celo
  const stableToken = isSellGoldTx ? takerAmount.currencyCode : makerAmount.currencyCode
  const [gold, stable] = isSellGoldTx
    ? [makerAmount.value, takerAmount.value]
    : [takerAmount.value, makerAmount.value]

  // TODO: show real fees
  const tobinTax = new BigNumber('0')
  const fee = new BigNumber('0')
  const totalFee = new BigNumber(tobinTax).plus(fee)
  const feeCurrency = Currency.Dollar

  const localAmount = (isSellGoldTx ? makerAmount : takerAmount).localAmount
  // TODO: find a way on how to show local exchangeRate without this hack
  const exchangeRateAmount = {
    value: localAmount?.exchangeRate || '',
    currencyCode: Currency.Dollar,
    localAmount: localAmount
      ? {
          value: localAmount.exchangeRate,
          exchangeRate: localAmount.exchangeRate,
          currencyCode: localAmount.currencyCode,
        }
      : null,
  }

  const goldAmount = {
    value: gold,
    currencyCode: Currency.Celo,
  }

  const subtotalAmount = {
    value: stable,
    currencyCode: stableToken,
  }

  const totalAmount = {
    value: new BigNumber(stable).plus(totalFee),
    currencyCode: stableToken,
  }

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <View style={styles.paddedContainer}>
          <View style={styles.flexStart}>
            <View style={styles.amountRow}>
              <Text style={styles.exchangeBodyText}>{t('goldAmount')}</Text>
              <CurrencyDisplay
                style={styles.currencyAmountText}
                amount={goldAmount}
                testID="CeloAmount"
              />
            </View>
            <HorizontalLine />
            <LineItemRow
              title={
                <Trans i18nKey="subtotalAmount">
                  Subtotal @{' '}
                  <CurrencyDisplay
                    amount={exchangeRateAmount}
                    showLocalAmount={true}
                    testID="CeloExchangeRate"
                  />
                </Trans>
              }
              amount={<CurrencyDisplay amount={subtotalAmount} />}
            />
            <FeeDrawer
              testID={'feeDrawer/ExchangeConfirmationCard'}
              currency={feeCurrency}
              securityFee={fee}
              exchangeFee={tobinTax}
              isExchange={true}
              totalFee={totalFee}
            />
            <HorizontalLine />
            <TotalLineItem amount={totalAmount} />
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  paddedContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  exchangeBodyText: {
    ...fontStyles.regular600,
  },
  currencyAmountText: {
    ...fontStyles.regular600,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
})
