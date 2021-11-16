import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import TokenDisplay from 'src/components/TokenDisplay'
import i18n from 'src/i18n'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { TokenBalance } from 'src/tokens/reducer'
import { tokensWithBalanceSelector, totalTokenBalanceSelector } from 'src/tokens/selectors'

type Props = StackScreenProps<StackParamList, Screens.TokenBalances>
function TokenBalancesScreen({ navigation }: Props) {
  const tokens = useSelector(tokensWithBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalBalance = useSelector(totalTokenBalanceSelector)

  const header = () => {
    return (
      <View style={styles.header}>
        <Text style={fontStyles.navigationHeader}>{i18n.t('walletFlow5:balances')}</Text>
        <Text style={styles.subtext}>
          {localCurrencySymbol}
          {totalBalance}
        </Text>
      </View>
    )
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: header,
    })
  }, [navigation, totalBalance, localCurrencySymbol])

  function getTokenDisplay(token: TokenBalance) {
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
            showSymbol={false}
            testID={`tokenBalance:${token.symbol}`}
          />
          <TokenDisplay
            amount={new BigNumber(token.balance!)}
            tokenAddress={token.address}
            style={styles.subtext}
            testID={`tokenLocalBalance:${token.symbol}`}
          />
        </View>
      </View>
    )
  }

  return <ScrollView style={styles.scrollContainer}>{tokens.map(getTokenDisplay)}</ScrollView>
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
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
