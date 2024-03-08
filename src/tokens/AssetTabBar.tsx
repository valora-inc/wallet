import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { AssetTabType } from 'src/tokens/types'

const DEVICE_WIDTH_BREAKPOINT = 340

export default function TabBar({
  activeTab,
  onChange,
  displayPositions,
}: {
  activeTab: AssetTabType
  onChange: (selectedTab: AssetTabType) => void
  displayPositions: boolean
}) {
  const { t } = useTranslation()

  const items = useMemo(() => {
    const items = [t('assets.tabBar.tokens'), t('assets.tabBar.collectibles')]
    if (displayPositions) {
      items.push(t('assets.tabBar.dappPositions'))
    }
    return items
  }, [t, displayPositions])

  const handleSelectOption = (index: AssetTabType) => () => {
    ValoraAnalytics.track(
      [
        AssetsEvents.view_wallet_assets,
        AssetsEvents.view_collectibles,
        AssetsEvents.view_dapp_positions,
      ][index]
    )
    onChange(index)
    vibrateInformative()
  }

  // On a smaller device, if there are more than two tabs, use smaller gaps
  // between tabs
  const gap =
    items.length > 2 && variables.width < DEVICE_WIDTH_BREAKPOINT
      ? Spacing.Smallest8
      : Spacing.Regular16

  return (
    <View style={[styles.container, { gap }]} testID="Assets/TabBar">
      {items.map((value, index) => (
        <Touchable
          testID="Assets/TabBarItem"
          key={value}
          onPress={handleSelectOption(index)}
          style={styles.touchable}
        >
          <Text style={[index === activeTab ? styles.itemSelected : styles.item]} numberOfLines={1}>
            {value}
          </Text>
        </Touchable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  touchable: {
    flexShrink: 1,
  },
  item: {
    ...typeScale.bodyMedium,
    color: Colors.gray4,
  },
  itemSelected: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
})
