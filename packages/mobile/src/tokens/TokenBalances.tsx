import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import TokenDisplay from 'src/components/TokenDisplay'
import i18n from 'src/i18n'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { useTokenToLocalAmount } from 'src/tokens/hooks'
import { StoredTokenBalance, tokenBalancesSelector } from 'src/tokens/reducer'

function TokenBalancesScreen() {
  const tokenBalances = useSelector(tokenBalancesSelector)

  function getTokenDisplay(token: StoredTokenBalance) {
    return (
      <View style={styles.tokenContainer}>
        <View style={styles.row}>
          <Image source={{ uri: token.imageUrl }} style={styles.tokenImg} />
          <View style={styles.tokenLabels}>
            <Text style={styles.tokenName}>{token.symbol}</Text>
            <Text style={styles.subtext}>{token.name}</Text>
          </View>
        </View>
        <View style={styles.balances}>
          <TokenDisplay
            amount={new BigNumber(token.balance!)}
            tokenAddress={token.address}
            style={styles.tokenAmt}
            showLocalAmount={false}
            showSymbol={true}
          />
          <TokenDisplay
            amount={new BigNumber(token.balance!)}
            tokenAddress={token.address}
            style={styles.subtext}
          />
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {Object.values(tokenBalances)
        .filter((token) => token && token.balance && new BigNumber(token.balance).gt(0))
        .map((token) => getTokenDisplay(token!))}
    </ScrollView>
  )
}

const header = () => {
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const tokenBalances = useSelector(tokenBalancesSelector)
  const totalBalance = Object.values(tokenBalances).reduce((token1, token2) => {
    const balance = token2
      ? useTokenToLocalAmount(new BigNumber(token2.balance ?? 0), token2.address)
      : 0
    return balance ? balance.plus(token1) : token1
  }, new BigNumber(0))

  return (
    <View style={styles.header}>
      <Text style={fontStyles.navigationHeader}>{i18n.t('walletFlow5:balances')}</Text>
      <Text style={styles.subtext}>
        {localCurrencySymbol}
        {totalBalance.toFixed(2).toString()}
      </Text>
    </View>
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
  headerTitle: header,
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
    justifyContent: 'space-between',
    flex: 1,
  },
  tokenLabels: {
    flexDirection: 'column',
  },
  balances: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  tokenName: {
    ...fontStyles.large600,
  },
  subtext: {
    ...fontStyles.small,
    color: Colors.gray4,
  },
  tokenAmt: {
    ...fontStyles.large600,
  },
})

export default TokenBalancesScreen
