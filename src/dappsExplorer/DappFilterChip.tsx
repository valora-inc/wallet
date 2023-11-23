import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface DappFilterChip {
  filterId: string
  filterName: string
  isSelected: boolean
  onPress: (filterId: string) => void
  style?: StyleProp<ViewStyle>
}

function DappFilterChip({ filterId, filterName, isSelected, onPress, style }: DappFilterChip) {
  const filterPress = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter, { id: filterId, remove: isSelected })
    onPress(filterId)
  }

  return (
    <View
      style={[
        styles.filterChipContainer,
        // Filter chips color based on selected filter
        isSelected
          ? { backgroundColor: colors.infoDark }
          : { backgroundColor: colors.onboardingLightBlue },
        style,
      ]}
    >
      <Touchable
        onPress={filterPress}
        style={styles.filterChip}
        testID={`DAppsExplorerScreenFilter/FilterChip/${filterId}`}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected ? { color: colors.onboardingLightBlue } : { color: colors.infoDark },
          ]}
        >
          {filterName}
        </Text>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  filterChipContainer: {
    marginLeft: Spacing.Smallest8,
    overflow: 'hidden',
    borderRadius: 94,
    flex: 1,
  },
  filterChip: {
    minHeight: 32,
    minWidth: 42,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
  },
  filterChipText: {
    ...fontStyles.small,
  },
})

export default DappFilterChip
