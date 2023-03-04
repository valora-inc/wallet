import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import { DappFilter } from 'src/dapps/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface DappFilterChip {
  chipFilter: DappFilter
  selectedFilter: DappFilter
  setFilter: (filter: DappFilter) => void
  lastChip: boolean
}

function DappFilterChip({ chipFilter, selectedFilter, setFilter, lastChip }: DappFilterChip) {
  const filterPress = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter, { id: chipFilter.id })
    setFilter(chipFilter)
  }

  return (
    <View
      style={[
        styles.filterChipContainer,
        // Filter chips color based on selected filter
        chipFilter.id === selectedFilter.id
          ? { backgroundColor: colors.onboardingBlue }
          : { backgroundColor: colors.onboardingLightBlue },
        // First Chip has slightly different margins
        chipFilter.id === 'all'
          ? { marginLeft: Spacing.Thick24 }
          : { marginLeft: Spacing.Smallest8 },
        // Last Chip has slightly different right margin
        lastChip && { marginRight: Spacing.Regular16 },
      ]}
    >
      <Touchable
        onPress={filterPress}
        style={styles.filterChip}
        testID={`DAppsExplorerScreenFilter/FilterChip/${chipFilter.id}`}
      >
        <Text
          style={[
            styles.filterChipText,
            chipFilter.id === selectedFilter.id
              ? { color: colors.onboardingLightBlue }
              : { color: colors.onboardingBlue },
          ]}
        >
          {chipFilter.name}
        </Text>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  filterChipContainer: {
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
