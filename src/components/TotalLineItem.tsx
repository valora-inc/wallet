import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import Touchable from 'src/components/Touchable'
import { useLocalCurrencyToShow } from 'src/localCurrency/hooks'
import { CurrencyInfo } from 'src/send/SendConfirmationLegacy'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Currency } from 'src/utils/currencies'

interface Props {
  title?: string
  amount: MoneyAmount
  hideSign?: boolean
  currencyInfo?: CurrencyInfo
  showExchangeRate?: boolean
  canEditCurrency?: boolean
  onEditCurrency?: () => void
}

const totalAmountKey = {
  [Currency.Dollar]: 'totalInDollars',
  [Currency.Euro]: 'totalInEuros',
  [Currency.Celo]: 'totalInCelo',
}

export default function TotalLineItem({
  title,
  amount,
  hideSign,
  currencyInfo,
  showExchangeRate = true,
  canEditCurrency = false,
  onEditCurrency,
}: Props) {
  const { localCurrencyExchangeRate: exchangeRate, amountCurrency } = useLocalCurrencyToShow(
    amount,
    currencyInfo
  )

  const { t } = useTranslation()

  return (
    <>
      <LineItemRow
        title={title || t('total')}
        textStyle={fontStyles.regular600}
        amount={
          <CurrencyDisplay
            amount={amount}
            hideSign={hideSign}
            currencyInfo={currencyInfo}
            testID="TotalLineItem/Total"
          />
        }
      />
      {showExchangeRate && exchangeRate && (
        <LineItemRow
          title={
            <Touchable disabled={!canEditCurrency} onPress={onEditCurrency}>
              <Text style={styles.exchangeRate}>
                <Trans i18nKey={totalAmountKey[amountCurrency]}>
                  <CurrencyDisplay
                    amount={{
                      value: new BigNumber(exchangeRate).pow(
                        amountCurrency === Currency.Celo ? 1 : -1
                      ),
                      currencyCode: Currency.Dollar, // The currency is actually the local amount
                    }}
                    showLocalAmount={false}
                    currencyInfo={currencyInfo}
                    testID="TotalLineItem/ExchangeRate"
                  />
                </Trans>
                {canEditCurrency && (
                  <>
                    {' '}
                    <Text style={styles.edit}>{t('edit')}</Text>
                  </>
                )}
              </Text>
            </Touchable>
          }
          amount={
            <CurrencyDisplay
              amount={amount}
              showLocalAmount={amountCurrency === Currency.Celo}
              hideSymbol={false}
              hideSign={hideSign}
              currencyInfo={currencyInfo}
              testID="TotalLineItem/Subtotal"
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
  exchangeRate: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  edit: {
    textDecorationLine: 'underline',
  },
})
