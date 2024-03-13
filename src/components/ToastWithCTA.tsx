import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

interface Props extends InLineNotificationProps {
  showToast: boolean
  onUnmount?: () => void
}

// this value is used to ensure the toast is offset by its own height when transitioning in and out of view
const TOAST_HEIGHT = 100

// for now, this Toast component is launched from the bottom of the screen only
const ToastWithCTA = ({ showToast, onUnmount, ...inLineNotificationProps }: Props) => {
  const [isVisible, setIsVisible] = useState(showToast)

  useEffect(() => {
    return () => {
      if (onUnmount) {
        onUnmount()
      }
    }
  }, [])

  const progress = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: (1 - progress.value) * TOAST_HEIGHT }],
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

  if (!isVisible) {
    return null
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.modal, styles.container]}>
      <Animated.View style={[styles.modal, styles.background, animatedOpacity]} />
      <Animated.View style={[styles.notificationContainer, animatedStyle]}>
        <InLineNotification {...inLineNotificationProps} />
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    paddingHorizontal: Spacing.Regular16,
    alignItems: 'center',
  },
  background: {
    backgroundColor: Colors.black,
  },
  notificationContainer: {
    position: 'absolute',
    bottom: Spacing.Large32,
    width: '100%',
  },
})

export default ToastWithCTA
