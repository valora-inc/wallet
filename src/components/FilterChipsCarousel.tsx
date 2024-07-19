import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { NetworkId } from 'src/transactions/types'

interface BaseFilterChip {
  id: string
  name: string
  isSelected: boolean
}
export interface BooleanFilterChip<T> extends BaseFilterChip {
  filterFn: (t: T) => boolean
}

export interface NetworkFilterChip<T> extends BaseFilterChip {
  filterFn: (t: T, n: NetworkId[]) => boolean
  allNetworkIds: NetworkId[]
  selectedNetworkIds: NetworkId[]
}

export interface TokenSelectFilterChip<T> extends BaseFilterChip {
  filterFn: (t: T, tokenId: string) => boolean
  selectedTokenId: string
}

export function isNetworkChip<T>(chip: FilterChip<T>): chip is NetworkFilterChip<T> {
  return 'allNetworkIds' in chip
}

export function isTokenSelectChip<T>(chip: FilterChip<T>): chip is TokenSelectFilterChip<T> {
  return 'selectedTokenId' in chip
}

export type FilterChip<T> = BooleanFilterChip<T> | NetworkFilterChip<T> | TokenSelectFilterChip<T>

interface Props<T> {
  chips: FilterChip<T>[]
  onSelectChip(chip: FilterChip<T>): void
  primaryColor?: colors
  primaryBorderColor?: colors
  primaryTextColor?: colors
  secondaryColor?: colors
  secondaryBorderColor?: colors
  secondaryTextColor?: colors
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  forwardedRef?: React.RefObject<ScrollView>
  scrollEnabled?: boolean
}

function FilterChipsCarousel<T>({
  chips,
  onSelectChip,
  primaryColor = colors.black,
  primaryBorderColor = colors.black,
  primaryTextColor = colors.white,
  secondaryColor = colors.gray1,
  secondaryBorderColor = colors.gray2,
  secondaryTextColor = colors.gray4,
  style,
  contentContainerStyle,
  forwardedRef,
  scrollEnabled = true,
}: Props<T>) {
  return (
    <ScrollView
      horizontal={true}
      scrollEnabled={scrollEnabled}
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={[
        styles.contentContainer,
        { width: scrollEnabled ? 'auto' : '100%' },
        contentContainerStyle,
      ]}
      ref={forwardedRef}
      testID="FilterChipsCarousel"
    >
      {chips.map((chip) => {
        return (
          <View
            key={chip.id}
            style={[
              styles.filterChipBackground,
              chip.isSelected
                ? { backgroundColor: primaryColor, borderColor: primaryBorderColor }
                : { backgroundColor: secondaryColor, borderColor: secondaryBorderColor },
            ]}
          >
            <Touchable
              onPress={() => {
                onSelectChip(chip)
              }}
              style={styles.filterChip}
            >
              <View style={styles.filterChipTextWrapper}>
                <Text
                  style={[
                    styles.filterChipText,
                    chip.isSelected ? { color: primaryTextColor } : { color: secondaryTextColor },
                  ]}
                >
                  {chip.name}
                </Text>
                {(isNetworkChip(chip) || isTokenSelectChip(chip)) && (
                  <DownArrowIcon
                    color={chip.isSelected ? secondaryColor : primaryColor}
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
    borderWidth: 1,
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
  filterChipTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default FilterChipsCarousel
