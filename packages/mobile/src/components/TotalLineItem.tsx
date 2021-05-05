import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import { Namespaces } from 'src/i18n'
import { useLocalCurrencyToShow } from 'src/localCurrency/hooks'
import { CurrencyInfo } from 'src/send/SendConfirmation'
import { CURRENCIES, Currency } from 'src/utils/currencies'

interface Props {
  title?: string
  amount: MoneyAmount
  hideSign?: boolean
  currencyInfo?: CurrencyInfo
}

const totalAmountKey = {
  [Currency.Dollar]: 'totalInDollars',
  [Currency.Euro]: 'totalInEuros',
  [Currency.Celo]: 'totalInCelo',
}

export default function TotalLineItem({ title, amount, hideSign, currencyInfo }: Props) {
  const { localCurrencyExchangeRate: exchangeRate, txCurrency } = useLocalCurrencyToShow(
    amount,
    currencyInfo
  )

  const { t } = useTranslation(Namespaces.global)

  return (
    <>
      <LineItemRow
        title={title || t('total')}
        textStyle={fontStyles.regular600}
        amount={<CurrencyDisplay amount={amount} hideSign={hideSign} currencyInfo={currencyInfo} />}
      />
      {exchangeRate && (
        <LineItemRow
          title={
            <Trans i18nKey={totalAmountKey[txCurrency]} ns={Namespaces.global}>
              <CurrencyDisplay
                amount={{
                  value: new BigNumber(exchangeRate).pow(txCurrency === Currency.Celo ? 1 : -1),
                  currencyCode: CURRENCIES[Currency.Dollar].code,
                }}
                showLocalAmount={false}
                currencyInfo={currencyInfo}
              />
            </Trans>
          }
          amount={
            <CurrencyDisplay
              amount={amount}
              showLocalAmount={txCurrency === Currency.Celo}
              hideSymbol={false}
              hideSign={hideSign}
              currencyInfo={currencyInfo}
            />
          }
          style={styles.dollars}
          textStyle={styles.dollarsText}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  dollars: {
    marginVertical: 0,
  },
  dollarsText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})
