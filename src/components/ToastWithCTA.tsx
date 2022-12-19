import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
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

const ToastWithCTA = ({ showToast, onPress, message, labelCTA, title }: Props): JSX.Element => {
  const positionY = useSharedValue(100)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      // TODO sort out this animation
      transform: [{ translateY: withSpring(positionY.value) }],
    }
  })

  if (showToast) {
    positionY.value = -24
  }

  if (!showToast) {
    positionY.value = 100
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
      <Touchable onPress={onPress} hitSlop={variables.iconHitslop}>
        <Text style={styles.labelCTA}>{labelCTA}</Text>
      </Touchable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark,
    borderRadius: 8,
    marginHorizontal: Spacing.Regular16,
    padding: Spacing.Regular16,
    bottom: Spacing.Small12,
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
