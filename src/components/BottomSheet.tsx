import React, { useEffect, useState } from 'react'
import {
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

interface Props {
  isVisible: boolean
  onBackgroundPress?: () => void
  children?: JSX.Element
  testID?: string
  opacity?: number
  backgroundColor?: string
}

const MIN_EMPTY_SPACE = 100

/**
 * @deprecated use https://www.npmjs.com/package/@gorhom/bottom-sheet instead, see example here https://github.com/valora-inc/wallet/blob/09c4d4ce98181480f1ed0a299709070d535221ad/src/dappsExplorer/useDappInfoBottomSheet.tsx#L47
 */
function BottomSheet({
  children,
  isVisible,
  onBackgroundPress,
  testID = 'BottomSheetContainer',
  opacity = 0.5,
  backgroundColor = colors.modalBackdrop,
}: Props) {
  const [showingOptions, setOptionsVisible] = useState(isVisible)
  const [pickerHeight, setPickerHeight] = useState(0)
  const safeAreaInsets = useSafeAreaInsets()

  useEffect(() => {
    if (isVisible) Keyboard.dismiss()
  }, [isVisible])

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
    opacity: opacity * progress.value,
    backgroundColor,
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
    <View style={styles.container} testID={testID}>
      <TouchableWithoutFeedback onPress={onBackgroundPress} testID={'BackgroundTouchable'}>
        <Animated.View style={[styles.background, animatedOpacity]} />
      </TouchableWithoutFeedback>
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
