import React, { useState } from 'react'
import { Dimensions, LayoutChangeEvent, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import Colors from 'src/styles/colors'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'

type RequiredProps<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

interface Props extends RequiredProps<InLineNotificationProps, 'ctaLabel' | 'onPressCta'> {
  showToast: boolean
  modal?: boolean
}

const ToastWithCTA = ({ showToast, modal, ...inLineNotificationProps }: Props) => {
  const [isVisible, setIsVisible] = useState(showToast)

  const window = Dimensions.get('window')
  const safeInitialHeight = Math.max(window.width, window.height)
  const [toastHeight, setToastHeight] = useState(safeInitialHeight)

  const insets = useSafeAreaInsets()
  const absolutePosition = Math.max(insets.bottom, Spacing.Regular16)

  const positionStyle = { bottom: absolutePosition }
  const slidingHeight = absolutePosition + toastHeight

  const progress = useSharedValue(0)
  const animatedTransform = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: (1 - progress.value) * slidingHeight }],
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
