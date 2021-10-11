import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import i18n from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { TokenBalance, tokenBalancesSelector } from 'src/tokens/reducer'
import { Currency } from 'src/utils/currencies'

function TokenBalancesScreen() {
  const tokenBalances = useSelector(tokenBalancesSelector)

  function getTokenDisplay(token: TokenBalance) {
    const usdAmt = {
      value: new BigNumber(token.balance!).multipliedBy(new BigNumber(token.usdPrice ?? 0)),
      currencyCode: Currency.Dollar,
    }

    return (
      <View style={styles.tokenContainer}>
        <Image source={{ uri: token.imageUrl }} style={styles.tokenImg} />
        <View style={styles.balances}>
          {token.usdPrice ? (
            <CurrencyDisplay style={styles.localAmt} amount={usdAmt} showLocalAmount={true} />
          ) : (
            <Text style={styles.localAmt}>-</Text>
          )}
          <Text style={styles.tokenAmt}>{`${new BigNumber(token.balance!).toFormat(2)} ${
            token.symbol
          }`}</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {Object.values(tokenBalances)
        .filter(
          (token: TokenBalance) => token.balance && new BigNumber(token.balance).comparedTo(0)
        )
        .map((token: TokenBalance) => getTokenDisplay(token))}
    </ScrollView>
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
  headerTitle: i18n.t('walletFlow5:balances'),
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
  },
  tokenImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenContainer: {
    flexDirection: 'row',
    paddingTop: 22,
  },
  balances: {
    flexDirection: 'column',
  },
  localAmt: {
    ...fontStyles.small500,
  },
  tokenAmt: {
    ...fontStyles.large600,
  },
})

export default TokenBalancesScreen
