import React from 'react'
import {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import PoolCard from 'src/earn/PoolCard'
import { Pool } from 'src/earn/types'
import { Spacing } from 'src/styles/styles'

const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<Pool>>(FlatList)

export default function PoolList({
  handleScroll,
  listHeaderHeight,
  paddingBottom,
  displayPools,
}: {
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  listHeaderHeight: number
  paddingBottom: number
  displayPools: Pool[]
}) {
  return (
    <AnimatedFlatList
      data={displayPools}
      renderItem={({ item }) => <PoolCard pool={item} testID={`PoolCard/${item.poolId}`} />}
      keyExtractor={(item) => item.poolId}
      onScroll={handleScroll}
      // Workaround iOS setting an incorrect automatic inset at the top
      scrollIndicatorInsets={{ top: 0.01 }}
      scrollEventThrottle={16}
      ListHeaderComponent={<View style={{ height: listHeaderHeight }} />}
      style={styles.sectionList}
      contentContainerStyle={[
        styles.sectionListContentContainer,
        { paddingBottom: Math.max(paddingBottom, Spacing.Regular16) },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  sectionListContentContainer: {
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Smallest8,
    flexGrow: 1,
  },
  sectionList: {
    flex: 1,
  },
})
