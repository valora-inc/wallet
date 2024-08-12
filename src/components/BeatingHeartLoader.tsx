import React, { useEffect } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import LogoHeart from 'src/icons/LogoHeart'

const BeatingHeartLoader = ({ size }: { size: number }) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600, easing: Easing.ease }),
        withTiming(1, { duration: 200, easing: Easing.ease })
      ),
      -1,
      false
    )
  }, [])

  return (
    <Animated.View style={animatedStyle}>
      <LogoHeart size={size} />
    </Animated.View>
  )
}

export default BeatingHeartLoader
