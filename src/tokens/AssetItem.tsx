import BigNumber from 'bignumber.js'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import PercentageIndicator from 'src/components/PercentageIndicator'
import TokenDisplay from 'src/components/TokenDisplay'
import { Position } from 'src/positions/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'
import { isHistoricalPriceUpdated } from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'

export const PositionItem = ({ position }: { position: Position }) => {
  const balanceInDecimal =
    position.type === 'contract-position' ? undefined : new BigNumber(position.balance)
  const balanceUsd =
    position.type === 'contract-position'
      ? new BigNumber(position.balanceUsd)
      : new BigNumber(position.balance).multipliedBy(position.priceUsd)

  const onPress = () => {
    ValoraAnalytics.track(AssetsEvents.tap_asset, {
      assetType: 'position',
      network: position.network,
      appId: position.appId,
      address: position.address,
      title: position.displayProps.title,
      description: position.displayProps.description,
      balanceUsd: balanceUsd.toNumber(),
    })
  }

  return (
    <TouchableWithoutFeedback
      testID="PositionItem"
      style={styles.positionsContainer}
      onPress={onPress}
    >
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
        {balanceUsd.gt(0) || balanceUsd.lt(0) ? (
          <LegacyTokenDisplay
            amount={balanceUsd}
            currency={Currency.Dollar}
            style={styles.tokenAmt}
          />
        ) : (
          // If the balance is 0 / NaN, display a dash instead
          // as it means we don't have a price for at least one of the underlying tokens
          <Text style={styles.tokenAmt}>-</Text>
        )}
        {balanceInDecimal && (
          <LegacyTokenDisplay
            amount={balanceInDecimal}
            // Hack to display the token balance without having said token in the base token list
            currency={Currency.Celo}
            style={styles.subtext}
            showLocalAmount={false}
            showSymbol={false}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

export const TokenBalanceItem = ({
  token,
  showPriceChangeIndicatorInBalances,
}: {
  token: TokenBalance
  showPriceChangeIndicatorInBalances: boolean
}) => {
  const onPress = () => {
    ValoraAnalytics.track(AssetsEvents.tap_asset, {
      assetType: 'token',
      address: token.address,
      title: token.symbol,
      description: token.name,
      balanceUsd: token.balance.multipliedBy(token.priceUsd ?? 0).toNumber(),
    })
  }

  return (
    <TouchableWithoutFeedback
      testID="TokenBalanceItem"
      key={`Token${token.address}`}
      style={styles.container}
      onPress={onPress}
    >
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
          tokenId={token.tokenId}
          style={styles.tokenAmt}
          showLocalAmount={false}
          showSymbol={false}
          testID={`tokenBalance:${token.symbol}`}
        />
        {token.priceUsd?.gt(0) && (
          <View style={styles.tokenContainer}>
            {showPriceChangeIndicatorInBalances &&
              token.historicalPricesUsd?.lastDay &&
              isHistoricalPriceUpdated(token) && (
                <PercentageIndicator
                  testID={`percentageIndicator:${token.symbol}`}
                  comparedValue={token.historicalPricesUsd.lastDay.price}
                  currentValue={token.priceUsd}
                />
              )}
            <TokenDisplay
              amount={new BigNumber(token.balance!)}
              tokenId={token.tokenId}
              style={{ ...styles.subtext, marginLeft: 8 }}
              testID={`tokenLocalBalance:${token.symbol}`}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
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
