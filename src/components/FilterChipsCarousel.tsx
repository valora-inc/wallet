import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { NetworkId } from 'src/transactions/types'

interface BooleanFilterChip<T> {
  id: string
  name: string
  filterFn: (t: T, n?: NetworkId[]) => boolean
  isSelected: boolean
}

export interface NetworkFilterChip<T> extends BooleanFilterChip<T> {
  allNetworkIds: NetworkId[]
  selectedNetworkIds: NetworkId[]
  networkChipRef: React.RefObject<BottomSheetRefType>
}

export type FilterChip<T> = BooleanFilterChip<T> | NetworkFilterChip<T>

interface Props<T> {
  chips: (FilterChip<T> | NetworkFilterChip<T>)[]
  onSelectChip(chip: FilterChip<T>): void
  primaryColor: colors
  secondaryColor: colors
  style?: StyleProp<ViewStyle>
  forwardedRef?: React.RefObject<ScrollView>
  scrollEnabled?: boolean
}

function FilterChipsCarousel<T>({
  chips,
  onSelectChip,
  primaryColor,
  secondaryColor,
  style,
  forwardedRef,
  scrollEnabled = true,
}: Props<T>) {
  return (
    <ScrollView
      horizontal={true}
      scrollEnabled={scrollEnabled}
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentContainer, { width: scrollEnabled ? 'auto' : '100%' }]}
      ref={forwardedRef}
    >
      {chips.map((chip) => {
        const isNetworkChip = 'allNetworkIds' in chip
        const isSelected = isNetworkChip
          ? chip.allNetworkIds.length !== chip.selectedNetworkIds.length
          : chip.isSelected
        return (
          <View
            key={chip.id}
            style={[
              styles.filterChipBackground,
              isSelected ? { backgroundColor: primaryColor } : { backgroundColor: secondaryColor },
            ]}
          >
            <Touchable
              onPress={() => {
                onSelectChip(chip)
              }}
              style={styles.filterChip}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? { color: secondaryColor } : { color: primaryColor },
                  ]}
                >
                  {chip.name}
                </Text>
                {isNetworkChip && (
                  <DownArrowIcon
                    color={isSelected ? secondaryColor : primaryColor}
                    strokeWidth={2}
                    height={Spacing.Regular16}
                    style={{ marginBottom: 2, marginLeft: 4 }}
                  />
                )}
              </View>
            </Touchable>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -Spacing.Thick24,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Thick24,
    gap: Spacing.Smallest8,
    flexWrap: 'wrap',
  },
  filterChipBackground: {
    overflow: 'hidden',
    borderRadius: 94,
  },
  filterChip: {
    minHeight: 32,
    minWidth: 42,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
  },
  filterChipText: {
    ...typeScale.labelXSmall,
  },
})

export default FilterChipsCarousel
