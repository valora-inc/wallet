import BigNumber from 'bignumber.js'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import { Position } from 'src/positions/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Currency } from 'src/utils/currencies'

export const PositionItem = ({
  position,
  hideBalances = false,
}: {
  position: Position
  hideBalances?: boolean
}) => {
  const balanceInDecimal =
    position.type === 'contract-position' ? undefined : new BigNumber(position.balance)
  const balanceUsd =
    position.type === 'contract-position'
      ? new BigNumber(position.balanceUsd)
      : new BigNumber(position.balance).multipliedBy(position.priceUsd)

  const onPress = () => {
    ValoraAnalytics.track(AssetsEvents.tap_asset, {
      assetType: 'position',
      network: position.networkId,
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
      {!hideBalances && (
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
      )}
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
  positionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
    justifyContent: 'space-between',
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
