import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import TokenDisplay from 'src/components/TokenDisplay'
import i18n from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { StoredTokenBalance, tokenBalancesSelector } from 'src/tokens/reducer'

function TokenBalancesScreen() {
  const tokenBalances = useSelector(tokenBalancesSelector)

  function getTokenDisplay(token: StoredTokenBalance) {
    return (
      <View style={styles.tokenContainer}>
        <Image source={{ uri: token.imageUrl }} style={styles.tokenImg} />
        <View style={styles.balances}>
          <TokenDisplay
            amount={new BigNumber(token.balance!)}
            tokenAddress={token.address}
            style={styles.localAmt}
          />
          <TokenDisplay
            amount={new BigNumber(token.balance!)}
            tokenAddress={token.address}
            style={styles.tokenAmt}
            showLocalAmount={false}
            showSymbol={true}
          />
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {Object.values(tokenBalances)
        .filter((token) => token && token.balance && new BigNumber(token.balance).comparedTo(0))
        .map((token) => getTokenDisplay(token!))}
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
    color: Colors.gray4,
  },
  tokenAmt: {
    ...fontStyles.large600,
  },
})

export default TokenBalancesScreen
