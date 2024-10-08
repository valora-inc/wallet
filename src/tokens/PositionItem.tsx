import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { earnPositionIdsSelector } from 'src/positions/selectors'
import { EarnPosition, Position } from 'src/positions/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { PositionIcon } from 'src/tokens/PositionIcon'
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
  const earnPositionIds = useSelector(earnPositionIdsSelector)

  const onPress = () => {
    AppAnalytics.track(AssetsEvents.tap_asset, {
      assetType: 'position',
      network: position.networkId,
      appId: position.appId,
      address: position.address,
      title: position.displayProps.title,
      description: position.displayProps.description,
      balanceUsd: balanceUsd.toNumber(),
    })
    earnPositionIds.includes(position.positionId)
      ? navigate(Screens.EarnPoolInfoScreen, { pool: position as EarnPosition })
      : position.displayProps.manageUrl
        ? navigate(Screens.WebViewScreen, {
            uri: position.displayProps.manageUrl,
          })
        : null
  }

  return (
    <TouchableWithoutFeedback
      testID="PositionItem"
      style={styles.positionsContainer}
      onPress={onPress}
    >
      <View style={styles.row}>
        <PositionIcon position={position} />

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
    ...typeScale.labelSemiBoldLarge,
  },
  subtext: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  tokenAmt: {
    ...typeScale.labelSemiBoldLarge,
  },
})
