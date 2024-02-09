import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

interface Props extends InLineNotificationProps {
  showNotification: boolean
}

// this value is used to animate the notification on and off the screen. the
// value should be equal or greater than the height of the notification,
// otherwise the notication will not transition smoothly.
const NOTIFICATION_HEIGHT = 500

// for now, this notification is launched from the bottom of the screen only
const BottomSheetInLineNotification = ({ showNotification, ...inLineNotificationProps }: Props) => {
  const [isVisible, setIsVisible] = useState(showNotification)

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

export default BottomSheetInLineNotification
