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
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
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

  const windowDimenstions = Dimensions.get('window')
  const safeInitialHeight = Math.max(windowDimenstions.width, windowDimenstions.height)
  const [notificationHeight, setNotificationHeight] = useState(safeInitialHeight)

  const { top } = useSafeAreaInsets()
  const positionStyle = { top }

  const slidingAreaHeight = top + notificationHeight

  const progress = useSharedValue(0)
  const animatedTransform = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -(1 - progress.value) * slidingAreaHeight }],
    }
  })
  const animatedBackdropOpacity = useAnimatedStyle(() => ({
    opacity: 0.5 * progress.value,
  }))

  const animatedConfettiOpacity = useAnimatedStyle(() => ({
    opacity: progress.value,
  }))

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
      <Animated.View
        style={[styles.notificationContainer, positionStyle, animatedTransform]}
        onLayout={handleLayout}
      >
        <View style={styles.notification}>
          {title && <Text style={styles.titleText}>{title}</Text>}
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      </Animated.View>
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
