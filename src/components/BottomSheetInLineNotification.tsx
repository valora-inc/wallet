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
  position?: 'top' | 'bottom'
}

// this value is used to animate the notification on and off the screen. the
// value should be equal or greater than the height of the notification,
// otherwise the notication will not transition smoothly.
const NOTIFICATION_HEIGHT = 500

const direction = { top: -1, bottom: 1 }
const margin = { top: Spacing.Regular16, bottom: Spacing.Large32 }

const BottomSheetInLineNotification = ({
  showNotification,
  position = 'bottom',
  ...inLineNotificationProps
}: Props) => {
  const [isVisible, setIsVisible] = useState(showNotification)

  const progress = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: (1 - progress.value) * NOTIFICATION_HEIGHT * direction[position] }],
    }
  })
  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: 0.5 * progress.value,
  }))

  const marginStyle = { [position]: margin[position] }

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
    <SafeAreaView edges={[position]} style={[styles.modal, styles.container]}>
      <Animated.View style={[styles.modal, styles.background, animatedOpacity]} />
      <Animated.View
        style={[styles.notificationContainer, marginStyle, animatedStyle]}
        testID="notificationContainer"
      >
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
    width: '100%',
  },
})

export default BottomSheetInLineNotification
