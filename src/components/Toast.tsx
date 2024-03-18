import React, { useState } from 'react'
import { Dimensions, LayoutChangeEvent, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

type RequiredProps<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type DismissHandler = () => void

interface Props extends Omit<InLineNotificationProps, 'withBorder'> {
  showToast: boolean
  position?: 'top' | 'bottom'
}

// toast with backdrop must have `onDismiss` handler (fired when user taps on the backdrop)
interface WithBackdrop extends Props {
  withBackdrop: true
  swipeable?: boolean
  onDismiss: DismissHandler
}

// swipeable toast must have `onDismiss` handler (fired when user swipes the toast away)
interface Swipeable extends Props {
  swipeable: true
  withBackdrop?: boolean
  onDismiss: DismissHandler
}

// if toast isn't swipeable nor has a backdrop it must have at least one CTA
interface MustHaveCTA extends RequiredProps<Props, 'ctaLabel' | 'onPressCta'> {
  withBackdrop?: false
  swipeable?: false
  onDismiss?: never
}

const slidingDirection = {
  top: -1,
  bottom: 1,
}

const Toast = ({
  showToast,
  withBackdrop,
  swipeable,
  position = 'bottom',
  onDismiss,
  ...inLineNotificationProps
}: WithBackdrop | Swipeable | MustHaveCTA) => {
  const [isVisible, setIsVisible] = useState(showToast)

  const window = Dimensions.get('window')
  const safeInitialHeight = Math.max(window.width, window.height)
  const [toastHeight, setToastHeight] = useState(safeInitialHeight)

  const insets = useSafeAreaInsets()
  const absolutePosition = Math.max(insets[position], Spacing.Regular16)

  const positionStyle = { [position]: absolutePosition }
  const slidingHeight = absolutePosition + toastHeight

  const progress = useSharedValue(0)
  const animatedTransform = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: (1 - progress.value) * slidingHeight * slidingDirection[position] },
      ],
    }
  })
  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: 0.5 * progress.value,
  }))

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

  const handleGesture = useAnimatedGestureHandler({
    onStart: (_, ctx: { initialProgress: number }) => {
      ctx.initialProgress = progress.value
    },
    onActive: (event, ctx) => {
      const translationY = event.translationY * slidingDirection[position]
      if (translationY < 0 /* wrong direction */) {
        const dampedTranslation = Math.sqrt(Math.abs(translationY))
        progress.value = ctx.initialProgress + dampedTranslation / slidingHeight
      } else {
        progress.value = ctx.initialProgress - translationY / slidingHeight
      }
    },
    onEnd: (event: { translationY: number }) => {
      const dismissThreshold = 0.33 * toastHeight
      const translationY = event.translationY * slidingDirection[position]
      if (onDismiss && translationY > dismissThreshold) {
        runOnJS(onDismiss)()
      } else {
        progress.value = withSpring(1)
      }
    },
  })

  const handleLayout = (event: LayoutChangeEvent) => {
    setToastHeight(event.nativeEvent.layout.height)
  }

  const toast = (
    <Animated.View
      style={[styles.notificationContainer, animatedTransform, positionStyle]}
      onLayout={handleLayout}
    >
      <InLineNotification
        withBorder={!withBackdrop}
        style={styles.notification}
        {...inLineNotificationProps}
      />
    </Animated.View>
  )

  if (!isVisible) {
    return null
  }

  return (
    <>
      {withBackdrop && (
        <TouchableWithoutFeedback onPress={onDismiss} testID="Toast/Backdrop">
          <Animated.View style={[styles.modal, styles.backdrop, animatedOpacity]} />
        </TouchableWithoutFeedback>
      )}
      {swipeable ? (
        <PanGestureHandler onGestureEvent={handleGesture}>{toast}</PanGestureHandler>
      ) : (
        toast
      )}
    </>
  )
}

const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    backgroundColor: Colors.black,
  },
  notificationContainer: {
    position: 'absolute',
    width: '100%',
  },
  notification: {
    marginHorizontal: Spacing.Regular16,
  },
})

export default Toast
