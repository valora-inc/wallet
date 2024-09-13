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
  stickyHeader?: React.ReactNode
  fullHeight?: boolean
}

const MIN_EMPTY_SPACE = 100

/**
 * @deprecated use https://www.npmjs.com/package/@gorhom/bottom-sheet instead, see example here https://github.com/valora-inc/wallet/blob/bbd0e39dcc1420a704fa866113994e9a20c3bfa4/src/tokens/TokenDetailsMoreActions.tsx#L27-L58
 */
function BottomSheet({
  children,
  isVisible,
  onBackgroundPress,
  testID = 'BottomSheetContainer',
  opacity = 0.5,
  backgroundColor = colors.black,
  stickyHeader,
  fullHeight = false,
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
  const minHeight = fullHeight ? maxHeight : undefined
  const paddingBottom = Math.max(safeAreaInsets.bottom, Spacing.Thick24)

  return (
    <View style={styles.container} testID={testID}>
      <TouchableWithoutFeedback onPress={onBackgroundPress} testID={'BackgroundTouchable'}>
        <Animated.View style={[styles.background, animatedOpacity]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.contentContainer,
          { paddingBottom, maxHeight: maxHeight, minHeight },
          animatedPickerPosition,
        ]}
        onLayout={onLayout}
      >
        <View style={styles.stickyHeader}>{stickyHeader}</View>

        <Animated.ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.scrollViewContent}
        >
          {children}
        </Animated.ScrollView>
      </Animated.View>
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
    backgroundColor: colors.white,
    borderTopRightRadius: Spacing.Regular16,
    borderTopLeftRadius: Spacing.Regular16,
  },
  scrollViewContent: {
    width: '100%',
    paddingHorizontal: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
  },
  stickyHeader: {
    padding: Spacing.Regular16,
    marginTop: Spacing.Regular16,
  },
})

export default BottomSheet
