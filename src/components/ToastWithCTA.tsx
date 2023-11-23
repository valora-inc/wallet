import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import Touchable from 'src/components/Touchable'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  showToast: boolean
  title?: string
  message: string | React.ReactNode
  labelCTA: string
  ctaAlignment?: 'bottom' | 'right'
  onPress(): void
}

// this value is used to ensure the toast is offset by its own height when transitioning in and out of view
const TOAST_HEIGHT = 100

// for now, this Toast component is launched from the bottom of the screen only
const ToastWithCTA = ({
  showToast,
  onPress,
  message,
  labelCTA,
  title,
  ctaAlignment = 'right',
}: Props) => {
  const [isVisible, setIsVisible] = useState(showToast)

  const progress = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: (1 - progress.value) * TOAST_HEIGHT }],
    }
  })

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
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.toast, ctaAlignment === 'right' ? styles.toastCtaAlignRight : {}]}>
        <View style={styles.contentContainer}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
        </View>
        <Touchable onPress={onPress} hitSlop={variables.iconHitslop}>
          <Text
            style={[styles.labelCta, ctaAlignment === 'right' ? {} : styles.labelCtaAlignBottom]}
          >
            {labelCTA}
          </Text>
        </Touchable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.Thick24,
    width: '100%',
  },
  toast: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    marginHorizontal: Spacing.Regular16,
    padding: Spacing.Regular16,
  },
  toastCtaAlignRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginRight: Spacing.Regular16,
  },
  title: {
    ...fontStyles.small600,
    color: Colors.white,
  },
  message: {
    ...fontStyles.small,
    color: Colors.white,
  },
  labelCta: {
    ...fontStyles.small600,
    color: Colors.greenFaint,
  },
  labelCtaAlignBottom: {
    alignSelf: 'flex-end',
    marginTop: Spacing.Regular16,
  },
})

export default ToastWithCTA
