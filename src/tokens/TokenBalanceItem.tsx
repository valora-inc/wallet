import BigNumber from 'bignumber.js'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import PercentageIndicator from 'src/components/PercentageIndicator'
import TokenDisplay from 'src/components/TokenDisplay'
import { TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES } from 'src/config'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

const TokenBalanceItem = ({
  token,
  showPriceChangeIndicatorInBalances,
}: {
  token: TokenBalance
  showPriceChangeIndicatorInBalances: boolean
}) => {
  const isHistoricalPriceUpdated = () => {
    return (
      token.historicalUsdPrices?.lastDay &&
      TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES >
        Math.abs(token.historicalUsdPrices.lastDay.at - (Date.now() - ONE_DAY_IN_MILLIS))
    )
  }

  return (
    <View key={`Token${token.address}`} style={styles.container}>
      <View style={styles.row}>
        <Image source={{ uri: token.imageUrl }} style={styles.tokenImg} />
        <View style={styles.tokenLabels}>
          <Text style={styles.tokenName}>{token.symbol}</Text>
          <Text style={styles.subtext}>{token.name}</Text>
        </View>
      </View>
      <View style={styles.balances}>
        <TokenDisplay
          amount={new BigNumber(token.balance)}
          tokenAddress={token.address}
          style={styles.tokenAmt}
          showLocalAmount={false}
          showSymbol={false}
          testID={`tokenBalance:${token.symbol}`}
        />
        {token.usdPrice?.gt(0) && (
          <View style={styles.tokenContainer}>
            {showPriceChangeIndicatorInBalances &&
              token.historicalUsdPrices &&
              isHistoricalPriceUpdated() && (
                <PercentageIndicator
                  testID={`percentageIndicator:${token.symbol}`}
                  comparedValue={token.historicalUsdPrices.lastDay.price}
                  currentValue={token.usdPrice}
                />
              )}
            <TokenDisplay
              amount={new BigNumber(token.balance!)}
              tokenAddress={token.address}
              style={{ ...styles.subtext, marginLeft: 8 }}
              testID={`tokenLocalBalance:${token.symbol}`}
            />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tokenImg: {
    width: 32,
    height: 32,
    borderRadius: 20,
    marginRight: Spacing.Regular16,
  },
  container: {
    flexDirection: 'row',
    paddingBottom: Spacing.Large32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  tokenLabels: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  balances: {
    flex: 1,
    alignItems: 'flex-end',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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

export default TokenBalanceItem
