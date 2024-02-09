import LottieView from 'lottie-react-native'
import React, { useState } from 'react'
import {
  Dimensions,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
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
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import confettiAnimation from './confettiAnimation.json'

interface Props {
  showAnimation: boolean
  title?: string | null
  description: string | null
  onAnimationFinish(): void
  onDismiss?(): void
}

const ANIMATION_DURATION = 6000 // 6 seconds

const ConfettiCelebration = ({
  showAnimation,
  title,
  description,
  onAnimationFinish,
  onDismiss,
}: Props) => {
  const [isVisible, setIsVisible] = useState(showAnimation)

  const window = Dimensions.get('window')
  const safeInitialHeight = Math.max(window.width, window.height)
  const [notificationHeight, setNotificationHeight] = useState(safeInitialHeight)

  const { top } = useSafeAreaInsets()
  const positionStyle = { top }

  const slidingHeight = top + notificationHeight

  const progress = useSharedValue(0)
  const animatedTransform = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -(1 - progress.value) * slidingHeight }],
    }
  })
  const animatedBackdropOpacity = useAnimatedStyle(() => ({
    opacity: 0.5 * progress.value,
  }))

  const animatedConfettiOpacity = useAnimatedStyle(() => ({
    opacity: progress.value,
  }))

  const handleGesture = useAnimatedGestureHandler({
    onStart: (_, ctx: { initialProgress: number }) => {
      ctx.initialProgress = progress.value
    },
    onActive: (event, ctx) => {
      if (event.translationY > 0 /* wrong direction */) {
        const dampedTranslation = Math.sqrt(Math.abs(event.translationY))
        progress.value = ctx.initialProgress + dampedTranslation / slidingHeight
      } else {
        progress.value = ctx.initialProgress + event.translationY / slidingHeight
      }
    },
    onEnd: (event: { translationY: number }) => {
      const dismissThreshold = 0.33 * notificationHeight
      const translationY = Math.abs(event.translationY)
      if (onDismiss && translationY > dismissThreshold) {
        runOnJS(onDismiss)()
      } else {
        progress.value = withSpring(1)
      }
    },
  })

  useShowOrHideAnimation(
    progress,
    showAnimation,
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
    setNotificationHeight(event.nativeEvent.layout.height)
  }

  return (
    <>
      <TouchableWithoutFeedback style={styles.modal} onPress={onDismiss}>
        <Animated.View style={[styles.modal, styles.backdrop, animatedBackdropOpacity]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.confetti, animatedConfettiOpacity]}>
        <LottieView
          autoPlay
          duration={ANIMATION_DURATION}
          loop={false}
          source={confettiAnimation}
          resizeMode="cover"
          onAnimationFinish={onAnimationFinish}
        />
      </Animated.View>
      <PanGestureHandler onGestureEvent={handleGesture}>
        <Animated.View
          style={[styles.notificationContainer, positionStyle, animatedTransform]}
          onLayout={handleLayout}
        >
          <View style={styles.notification}>
            {title && <Text style={styles.titleText}>{title}</Text>}
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
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
  confetti: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  notificationContainer: {
    position: 'absolute',
    width: '100%',
  },
  notification: {
    margin: Spacing.Regular16,
    padding: Spacing.Regular16,
    borderRadius: Spacing.Regular16,
    backgroundColor: Colors.gray1,
  },
  titleText: {
    ...typeScale.labelSemiBoldSmall,
    marginBottom: Spacing.Tiny4,
    color: Colors.black,
  },
  descriptionText: {
    ...typeScale.bodyXSmall,
    color: Colors.black,
  },
})

export default ConfettiCelebration
