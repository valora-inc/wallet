import { BottomSheetHandleProps } from '@gorhom/bottom-sheet'
import { keysIn, remove } from 'lodash'
import React, { memo, useMemo } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from 'react-native-reanimated'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Searchbar from 'src/components/SearchBar'
import { MapCategory } from 'src/map/constants'
import variables from 'src/styles/variables'

interface CustomHandleProps extends BottomSheetHandleProps {
  title: string
  style?: StyleProp<ViewStyle>
}

const MapSheetHandle: React.FC<CustomHandleProps> = ({ title, style, animatedIndex }) => {
  const containerStyle = useMemo(() => [styles.container, style], [style])
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderTopRadius = interpolate(animatedIndex.value, [1, 2], [20, 0], Extrapolate.CLAMP)
    return {
      borderTopLeftRadius: borderTopRadius,
      borderTopRightRadius: borderTopRadius,
    }
  })
  const renderFilters = () => {
    return (
      <>
        {remove(keysIn(MapCategory), (x) => x !== 'All').map((cat: string) => {
          return (
            <Button
              style={styles.filterButton}
              text={cat}
              size={BtnSizes.SMALL}
              type={BtnTypes.SECONDARY}
              onPress={() => {}}
            />
          )
        })}
      </>
    )
  }

  // render
  return (
    <Animated.View
      style={[containerStyle, containerAnimatedStyle]}
      renderToHardwareTextureAndroid={true}
    >
      <View style={[styles.headerFilter, styles.flex]}>{renderFilters()}</View>
      <View style={[styles.searchFilter]}>
        <Searchbar />
      </View>
    </Animated.View>
  )
}

export default memo(MapSheetHandle)

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    zIndex: 99999,
  },
  flex: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerFilter: {
    marginTop: -50,
    width: '100%',
  },
  searchFilter: {
    marginTop: variables.contentPadding,
  },
  filterButton: {
    marginHorizontal: 2,
  },
})
