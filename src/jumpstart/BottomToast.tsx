import React, { PropsWithChildren, useState } from 'react'
import { Dimensions, LayoutChangeEvent, StyleSheet } from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'

interface Props {
  showToast: boolean
  onDismiss?(): void
}

const BottomToast = ({ showToast, onDismiss, children }: PropsWithChildren<Props>) => {
  const [isVisible, setIsVisible] = useState(showToast)

  const window = Dimensions.get('window')
  const safeInitialHeight = Math.max(window.width, window.height)
  const [toastHeight, setToastHeight] = useState(safeInitialHeight)

  const { bottom } = useSafeAreaInsets()
  const insetsStyle = { bottom }

  const slidingHeight = bottom + toastHeight

  const progress = useSharedValue(0)
  const animatedTransform = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: (1 - progress.value) * slidingHeight }],
    }
  })

  const handleGesture = useAnimatedGestureHandler({
    onStart: (_, ctx: { initialProgress: number }) => {
      ctx.initialProgress = progress.value
    },
    onActive: (event, ctx) => {
      if (event.translationY < 0 /* wrong direction */) {
        const dampedTranslation = Math.sqrt(Math.abs(event.translationY))
        progress.value = ctx.initialProgress + dampedTranslation / slidingHeight
      } else {
        progress.value = ctx.initialProgress - event.translationY / slidingHeight
      }
    },
    onEnd: (event: { translationY: number }) => {
      const dismissThreshold = 0.33 * toastHeight
      if (onDismiss && event.translationY > dismissThreshold) {
        runOnJS(onDismiss)()
      } else {
        progress.value = withSpring(1)
      }
    },
  })

  useShowOrHideAnimation(
    progress,
    showToast,
    () => {
      setIsVisible(true)
    },
    () => {
      setIsVisible(false)
    }
  )

  if (!isVisible) {
    return null
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    setToastHeight(event.nativeEvent.layout.height)
  }

  return (
    <PanGestureHandler onGestureEvent={handleGesture}>
      <Animated.View
        style={[styles.container, insetsStyle, animatedTransform]}
        onLayout={handleLayout}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
  },
})

export default BottomToast
