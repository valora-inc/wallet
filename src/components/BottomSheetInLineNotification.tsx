import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props extends InLineNotificationProps {
  showNotification: boolean
  onUnmount?: () => void
  withBackdrop?: boolean
}

// this value is used to animate the notification on and off the screen. the
// value should be equal or greater than the height of the notification,
// otherwise the notication will not transition smoothly.
const NOTIFICATION_HEIGHT = 500

// for now, this notification is launched from the bottom of the screen only
const BottomSheetInLineNotification = ({
  showNotification,
  onUnmount,
  withBackdrop = true,
  ...inLineNotificationProps
}: Props) => {
  const [isVisible, setIsVisible] = useState(showNotification)

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
      transform: [{ translateY: (1 - progress.value) * NOTIFICATION_HEIGHT }],
    }
  })
  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: 0.5 * progress.value,
  }))

  useShowOrHideAnimation(
    progress,
    showNotification,
    () => {
      setIsVisible(true)
    },
    () => {
      setIsVisible(false)
    }
  )

  const AnimatedNotification = (
    <Animated.View style={[styles.notificationContainer, animatedStyle]}>
      <InLineNotification {...inLineNotificationProps} />
    </Animated.View>
  )

  if (!isVisible) {
    return null
  }

  if (withBackdrop) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.modal, styles.container]}>
        <Animated.View style={[styles.modal, styles.background, animatedOpacity]} />
        {AnimatedNotification}
      </SafeAreaView>
    )
  }

  return AnimatedNotification
}

const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    alignItems: 'center',
  },
  background: {
    backgroundColor: Colors.black,
  },
  notificationContainer: {
    position: 'absolute',
    bottom: Spacing.XLarge48,
    left: Spacing.Regular16,
    width: variables.width - Spacing.Large32,
  },
})

export default BottomSheetInLineNotification
