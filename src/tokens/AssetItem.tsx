import BigNumber from 'bignumber.js'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import PercentageIndicator from 'src/components/PercentageIndicator'
import TokenDisplay from 'src/components/TokenDisplay'
import { TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES } from 'src/config'
import { Position } from 'src/positions/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

export const PositionItem = ({ position }: { position: Position }) => {
  const balanceInDecimal =
    position.type === 'contract-position' ? undefined : new BigNumber(position.balance)
  const balanceUsd =
    position.type === 'contract-position'
      ? new BigNumber(position.balanceUsd)
      : new BigNumber(position.balance).multipliedBy(position.priceUsd)

  return (
    <View testID="PositionItem" style={styles.positionsContainer}>
      <View style={styles.row}>
        <Image source={{ uri: position.displayProps.imageUrl }} style={styles.tokenImg} />
        <View style={styles.tokenLabels}>
          <Text style={styles.tokenName} numberOfLines={1}>
            {position.displayProps.title}
          </Text>
          <Text style={styles.subtext}>{position.displayProps.description}</Text>
        </View>
      </View>
      <View style={styles.balances}>
        {balanceUsd.gt(0) && (
          <TokenDisplay amount={balanceUsd} currency={Currency.Dollar} style={styles.tokenAmt} />
        )}
        {balanceInDecimal && (
          <TokenDisplay
            amount={balanceInDecimal}
            // Hack to display the token balance without having said token in the base token list
            currency={Currency.Celo}
            style={styles.subtext}
            showLocalAmount={false}
            showSymbol={false}
          />
        )}
      </View>
    </View>
  )
}

export const TokenBalanceItem = ({
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
    <View testID="TokenBalanceItem" key={`Token${token.address}`} style={styles.container}>
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
    paddingHorizontal: Spacing.Thick24,
    paddingBottom: Spacing.Large32,
    justifyContent: 'space-between',
  },
  positionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
    justifyContent: 'space-between',
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
    alignItems: 'flex-end',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.Small12,
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
