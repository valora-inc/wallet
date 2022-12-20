import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Touchable from 'src/components/Touchable'
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

// the initial offset for the toast
// the value should be greater than the height of the toast to ensure it is initially hidden
const POSITION_Y_OFFSET = 100

// for now, this Toast component is launched from the bottom of the screen only
const ToastWithCTA = ({ showToast, onPress, message, labelCTA, title }: Props) => {
  const positionY = useSharedValue(POSITION_Y_OFFSET)

  positionY.value = showToast ? 0 : POSITION_Y_OFFSET

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withTiming(positionY.value) }],
    }
  })

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.toast}>
        <View>
          {title && <Text style={styles.title}>{title}</Text>}
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
