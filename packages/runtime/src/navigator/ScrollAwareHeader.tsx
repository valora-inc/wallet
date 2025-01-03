import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { StackParamList } from 'src/navigator/types'

interface Props {
  title: string | React.ReactNode
  subtitle?: string | null
  scrollPosition: Animated.SharedValue<number>
  navigation: NativeStackNavigationProp<StackParamList, keyof StackParamList>
  startFadeInPosition: number
  animationDistance: number
}

// This header is blank, after starting to scroll it will fade in the title and
// subtitle according to scroll position. The fade in starts at
// startFadeInPosition (in pt), and will be completely visible with opacity 1 at
// the scroll distance of animationDistance.
const useScrollAwareHeader = ({
  navigation,
  title,
  subtitle,
  scrollPosition,
  startFadeInPosition,
  animationDistance,
}: Props) => {
  const animatedScreenHeaderOpacity = useDerivedValue(() => {
    if (startFadeInPosition <= 0) {
      // initial render
      return 0
    }

    const animatedValue = (scrollPosition.value - startFadeInPosition) / animationDistance

    // return only values between 0 and 1
    return Math.max(0, Math.min(1, animatedValue))
  }, [scrollPosition.value, startFadeInPosition, animationDistance])

  const animatedScreenHeaderStyles = useAnimatedStyle(() => {
    return {
      opacity: animatedScreenHeaderOpacity.value,
    }
  }, [animatedScreenHeaderOpacity.value])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Animated.View style={animatedScreenHeaderStyles}>
          <HeaderTitleWithSubtitle title={title} subTitle={subtitle} />
        </Animated.View>
      ),
    })
  }, [navigation, title, subtitle, animatedScreenHeaderStyles])
}

export default useScrollAwareHeader
