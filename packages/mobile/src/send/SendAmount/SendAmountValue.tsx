import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { getLocalCurrencyCode, getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'

interface Props {
  amount: string
}

function SendAmountValue({ amount }: Props) {
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  return (
    <>
      <View style={styles.showAmountContainer}>
        <View style={styles.currencySymbolContainer}>
          <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.currencySymbol}>
            {localCurrencySymbol || localCurrencyCode}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.amount}>
            {amount ? amount : '0'}
          </Text>
        </View>
        <View style={styles.currencySymbolContainer}>
          <Text style={styles.currencySymbolTransparent}>
            {localCurrencySymbol || localCurrencyCode}
          </Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  showAmountContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  amountContainer: {
    justifyContent: 'center',
    maxWidth: '75%',
  },
  currencySymbolContainer: {
    justifyContent: 'center',
  },
  currencySymbol: {
    ...fontStyles.regular,
    fontSize: 32,
    lineHeight: 64,
    marginRight: 8,
  },
  currencySymbolTransparent: {
    ...fontStyles.regular,
    color: 'transparent',
    fontSize: 32,
    lineHeight: 64,
    marginLeft: 8,
  },
  amount: {
    ...fontStyles.regular,
    fontSize: 64,
    lineHeight: undefined,
  },
})

export default SendAmountValue
