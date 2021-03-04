import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import fontStyles from '@celo/react-components/styles/fonts'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from 'src/geth/consts'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

interface Props {
  currencyToBuy: CURRENCY_ENUM
  localCurrency: LocalCurrencyCode
  crypto: {
    amount: number
    price: number
  }
  fiat: {
    amount: number
    fees: number
    total: number
  }
}

export default function ReviewFees({ crypto, fiat, localCurrency, currencyToBuy }: Props) {
  const showAmount = (value: number, isCelo: boolean = false, styles: any[] = []) => (
    <CurrencyDisplay
      amount={{
        value: 0,
        localAmount: {
          value,
          currencyCode: isCelo ? currencyToBuy : localCurrency,
          exchangeRate: 1,
        },
        currencyCode: isCelo ? currencyToBuy : localCurrency,
      }}
      hideSymbol={false}
      showLocalAmount={true}
      hideSign={true}
      showExplicitPositiveSign={false}
      style={[...styles]}
    />
  )

  return (
    <View style={[styles.review]}>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>Amount ({currencyToBuy})</Text>
        <Text style={[styles.reviewLineText]}>{showAmount(crypto.amount, true)}</Text>
      </View>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>{currencyToBuy} price</Text>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>
          {showAmount(crypto.price, false, [styles.reviewLineTextAlt])}
        </Text>
      </View>
      <View style={[styles.line]} />
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>Subtotal @ {crypto.price.toFixed(2)}</Text>
        <Text style={[styles.reviewLineText]}>{showAmount(fiat.amount)}</Text>
      </View>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>Simplex Fee</Text>
        <Text style={[styles.reviewLineText]}>{showAmount(fiat.fees)}</Text>
      </View>
      <View style={[styles.line]} />
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextTotal]}>Total</Text>
        <Text style={[styles.reviewLineText, styles.reviewLineTextTotal]}>
          {showAmount(fiat.total, false, [styles.reviewLineTextTotal])}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  review: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  reviewLine: {
    ...fontStyles.regular,
    paddingVertical: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewLineText: {
    ...fontStyles.regular,
  },
  reviewLineTextAlt: {
    color: colors.gray4,
  },
  reviewLineTextTotal: {
    ...fontStyles.regular600,
  },
  line: {
    marginVertical: 16,
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
  },
})
