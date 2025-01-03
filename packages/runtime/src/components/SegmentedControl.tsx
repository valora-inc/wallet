import MaskedView from '@react-native-masked-view/masked-view'
import React from 'react'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Animated, { Extrapolation, interpolate, interpolateColor } from 'react-native-reanimated'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

const HEIGHT = 24

interface Props {
  values: string[]
  selectedIndex?: number
  onChange?: (value: string, selectedIndex: number) => void
}

export default function SegmentedControl({ values, selectedIndex = 0, onChange }: Props) {
  const [segmentWidth, setSegmentWidth] = React.useState(0)

  const handleChange = (index: number) => {
    onChange?.(values[index], index)
  }

  const inputRange = values.map((_, i) => i)
  const translateX = interpolate(
    selectedIndex,
    inputRange,
    inputRange.map((i) => i * segmentWidth),
    Extrapolation.CLAMP
  )

  const color = interpolateColor(selectedIndex, [0.5, 1], [colors.black, colors.white])
  const colorInverted = interpolateColor(selectedIndex, [0.5, 1], [colors.white, colors.black])

  const onLayout = ({
    nativeEvent: {
      layout: { width },
    },
  }: LayoutChangeEvent) => {
    const newSegmentWidth = values.length ? width / values.length : 0
    if (newSegmentWidth !== segmentWidth) {
      setSegmentWidth(newSegmentWidth)
    }
  }

  return (
    <Animated.View style={[styles.container, { borderColor: color }]} onLayout={onLayout}>
      {selectedIndex != null && !!segmentWidth && (
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [{ translateX }],
              width: segmentWidth,
              backgroundColor: color,
            },
          ]}
        />
      )}
      <MaskedView
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
        maskElement={
          <View style={styles.maskedContainer}>
            {values.map((value, index) => {
              return (
                <View key={value} style={styles.value}>
                  <Text maxFontSizeMultiplier={1.5} style={styles.text}>
                    {value}
                  </Text>
                </View>
              )
            })}
          </View>
        }
      >
        {/* Shows behind the mask, i.e. inside the text */}
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: color }} />
        {selectedIndex != null && !!segmentWidth && (
          <Animated.View
            style={[
              styles.slider,
              {
                transform: [{ translateX }],
                width: segmentWidth,
                backgroundColor: colorInverted,
              },
            ]}
          />
        )}
      </MaskedView>
      {values.map((value, index) => {
        const isFocused = index === selectedIndex
        const state = { selected: isFocused }
        const onPress = () => handleChange(index)
        return (
          <Touchable
            key={value}
            accessibilityRole="button"
            accessibilityState={state}
            accessibilityLabel={value}
            onPress={onPress}
            style={styles.value}
            testID={value}
          >
            <View />
          </Touchable>
        )
      })}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: 1,
    borderColor: colors.black,
    overflow: 'hidden',
    marginHorizontal: 30,
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: colors.black,
  },
  maskedContainer: {
    // Transparent background because mask is based off alpha channel.
    backgroundColor: 'transparent',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typeScale.labelSemiBoldXSmall,
    color: colors.accent,
  },
})
