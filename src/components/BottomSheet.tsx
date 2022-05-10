import React, { useState } from 'react'
import { Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

interface Props {
  isVisible: boolean
  onBackgroundPress?: () => void
  children?: JSX.Element
}

const MIN_EMPTY_SPACE = 100

function BottomSheet({ children, isVisible, onBackgroundPress }: Props) {
  const [showingOptions, setOptionsVisible] = useState(isVisible)
  const [pickerHeight, setPickerHeight] = useState(0)
  const safeAreaInsets = useSafeAreaInsets()

  const progress = useSharedValue(0)
  const animatedPickerPosition = useAnimatedStyle(
    () => ({
      transform: [{ translateY: (1 - progress.value) * pickerHeight }],
      // Hide until we have the height of the picker,
      // otherwise there's a 1 frame flicker with the fully visible picker
      opacity: pickerHeight > 0 ? 1 : 0,
    }),
    [pickerHeight]
  )
  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: 0.5 * progress.value,
  }))

  useShowOrHideAnimation(
    progress,
    isVisible,
    () => setOptionsVisible(true),
    () => {
      setPickerHeight(0)
      setOptionsVisible(false)
    }
  )

  if (!showingOptions) {
    return null
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setPickerHeight(height)
  }

  const maxHeight = Dimensions.get('window').height - MIN_EMPTY_SPACE
  const paddingBottom = Math.max(safeAreaInsets.bottom, Spacing.Thick24)

  return (
    <View style={styles.container} testID="BottomSheetContainer">
      <Animated.View style={[styles.background, animatedOpacity]}>
        <TouchableWithoutFeedback
          style={styles.backgroundTouchable}
          onPress={onBackgroundPress}
          testID={'BackgroundTouchable'}
        />
      </Animated.View>
      <Animated.ScrollView
        style={[styles.contentContainer, { paddingBottom, maxHeight }, animatedPickerPosition]}
        contentContainerStyle={pickerHeight >= maxHeight ? styles.fullHeightScrollView : undefined}
        onLayout={onLayout}
      >
        {children}
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  background: {
    position: 'absolute',
    backgroundColor: colors.modalBackdrop,
    opacity: 0.5,
    width: '100%',
    height: '100%',
  },
  backgroundTouchable: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    opacity: 1,
    width: '100%',
    backgroundColor: colors.light,
    padding: Spacing.Thick24,
    borderTopRightRadius: Spacing.Regular16,
    borderTopLeftRadius: Spacing.Regular16,
  },
  fullHeightScrollView: {
    paddingBottom: 50,
  },
})

export default BottomSheet
