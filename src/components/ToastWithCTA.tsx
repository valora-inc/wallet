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
  message: string | React.ReactElement
  labelCTA: string
  onPress(): void
}

// this value is used to ensure the toast is offset by its own height when transitioning in and out of view
const TOAST_HEIGHT = 100

// for now, this Toast component is launched from the bottom of the screen only
const ToastWithCTA = ({ showToast, onPress, message, labelCTA, title }: Props) => {
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
      <View style={styles.toast}>
        <View style={styles.contentContainer}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
        </View>
        <Touchable onPress={onPress} hitSlop={variables.iconHitslop}>
          <Text style={styles.labelCTA}>{labelCTA}</Text>
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
    backgroundColor: Colors.dark,
    borderRadius: 8,
    marginHorizontal: Spacing.Regular16,
    padding: Spacing.Regular16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginRight: Spacing.Small12,
  },
  title: {
    ...fontStyles.small600,
    color: Colors.light,
  },
  message: {
    ...fontStyles.small,
    color: Colors.light,
  },
  labelCTA: {
    ...fontStyles.small600,
    color: Colors.greenFaint,
  },
})

export default ToastWithCTA
