import { TouchableOpacity } from '@gorhom/bottom-sheet'
import { debounce } from 'lodash'
import React, { ReactNode, useCallback } from 'react'
import { StyleSheet, Text } from 'react-native'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

export type FilterButtonProps = {
  onPress: () => void
  text: string | ReactNode
  accessibilityLabel?: string
  activeColor?: Colors
  active: boolean
  type?: FilterButtonTypes
}

export enum FilterButtonTypes {
  VENDOR = 'Vendor',
  FOREST = 'Food Forest',
}

export const FilterButton = ({
  text,
  accessibilityLabel,
  activeColor,
  active,
  type,
  onPress,
}: FilterButtonProps) => {
  // Debounce onPress event so that it is only called once
  // for multiple subsequent calls in a given period
  const debouncePress = useCallback(debounce(onPress, 100, { leading: true, trailing: false }), [
    onPress,
    active,
  ])

  const icon = getIcon(type, active)
  const { textColor, backgroundColor } = getColors(type, active)

  return (
    <TouchableOpacity
      onPress={debouncePress}
      style={[styles.wrapper, { backgroundColor }, styles.rounded]}
    >
      <>
        {icon}
        <Text
          maxFontSizeMultiplier={1}
          accessibilityLabel={accessibilityLabel}
          style={{ ...styles.textStyle, color: textColor }}
        >
          {text}
        </Text>
      </>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    maxHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: (variables.contentPadding * 2) / 3,
    marginHorizontal: variables.contentPadding / 3,
  },
  rounded: {
    borderRadius: 100,
  },
  textStyle: {
    ...fontStyles.small,
  },
})

const getIcon = (type: FilterButtonTypes | undefined, active: boolean = false) => {
  const textColor = active ? Colors.light : Colors.dark
  let backgroundColor, opacity
  switch (type) {
    case FilterButtonTypes.VENDOR: {
      return <></>
    }
    case FilterButtonTypes.FOREST: {
      return <></>
    }
    default: {
      return <></>
    }
  }
  return { textColor, backgroundColor }
}
const getColors = (type: FilterButtonTypes | undefined, active: boolean = false) => {
  const textColor = active ? Colors.light : Colors.dark
  let backgroundColor, opacity
  switch (type) {
    case FilterButtonTypes.VENDOR: {
      backgroundColor = active ? Colors.vendorButton : Colors.gray3
      break
    }
    case FilterButtonTypes.FOREST: {
      backgroundColor = active ? Colors.forestButton : Colors.gray3
      break
    }
    default: {
      backgroundColor = active ? Colors.greenBrand : Colors.gray3
      break
    }
  }
  return { textColor, backgroundColor }
}

export const MapFilterButton = React.memo(FilterButton)
