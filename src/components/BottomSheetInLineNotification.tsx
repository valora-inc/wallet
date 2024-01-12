import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'
import Modal from 'src/components/Modal'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import { Spacing } from 'src/styles/styles'

interface Props extends InLineNotificationProps {
  showNotification: boolean
}

// this value is used to ensure the notification is offset by its own height when transitioning in and out of view
const NOTIFICATION_HEIGHT = 200

// for now, this notification is launched from the bottom of the screen only
const BottomSheetInLineNotification = ({ showNotification, ...inLineNotificationProps }: Props) => {
  const [isVisible, setIsVisible] = useState(showNotification)

  const progress = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: (1 - progress.value) * NOTIFICATION_HEIGHT }],
    }
  })

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
    <Modal style={styles.modal} isVisible={true} backdropOpacity={0.5}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <InLineNotification {...inLineNotificationProps} />
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modal: {
    height: '100%',
    backgroundColor: 'transparent',
    padding: 0,
  },
  container: {
    position: 'absolute',
    bottom: Spacing.Thick24,
    width: '100%',
  },
})

export default BottomSheetInLineNotification
