import React, { useEffect, useState } from 'react'
import { Dimensions, LayoutChangeEvent, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import Colors from 'src/styles/colors'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'

interface Props extends InLineNotificationProps {
  showToast: boolean
  position?: 'top' | 'bottom'
  modal?: boolean
  onUnmount?: () => void
}

const slidingDirection = {
  top: -1,
  bottom: 1,
}

const ToastWithCTA = ({
  showToast,
  position = 'bottom',
  modal,
  onUnmount,
  ...inLineNotificationProps
}: Props) => {
  const [isVisible, setIsVisible] = useState(showToast)

  const window = Dimensions.get('window')
  const safeInitialHeight = Math.max(window.width, window.height)
  const [toastHeight, setToastHeight] = useState(safeInitialHeight)

  const insets = useSafeAreaInsets()
  const absolutePosition = Math.max(insets[position], Spacing.Regular16)

  const positionStyle = { [position]: absolutePosition }
  const slidingHeight = absolutePosition + toastHeight

  useEffect(() => {
    return () => {
      if (onUnmount) {
        onUnmount()
      }
    }
  }, [])

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

  const handleLayout = (event: LayoutChangeEvent) => {
    setToastHeight(event.nativeEvent.layout.height)
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      {modal && <Animated.View style={[styles.modal, styles.background, animatedOpacity]} />}
      <Animated.View
        style={[styles.notificationContainer, animatedTransform, positionStyle]}
        onLayout={handleLayout}
      >
        <InLineNotification
          style={[styles.notification, !modal && getShadowStyle(Shadow.AlertShadow)]}
          {...inLineNotificationProps}
        />
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
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

export default ToastWithCTA
