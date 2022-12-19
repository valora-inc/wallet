import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

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
    <Touchable onPress={onPress}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View>
          {title && <Text style={{ color: 'white' }}>{title}</Text>}
          <Text style={{ color: 'white' }}>{message}</Text>
        </View>
        <Text style={{ color: 'white' }}>{labelCTA}</Text>
      </Animated.View>
    </Touchable>
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
})

export default ToastWithCTA
