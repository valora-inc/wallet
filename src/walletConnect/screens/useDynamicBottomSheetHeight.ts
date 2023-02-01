import { BottomSheetNavigationProp } from '@th3rdwave/react-navigation-bottom-sheet'
import { useLayoutEffect } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { StackParamList } from 'src/navigator/types'

const useDynamicBottomSheetHeight = (navigation: BottomSheetNavigationProp<StackParamList>) => {
  const animatedContentHeight = useSharedValue(1)

  useLayoutEffect(() => {
    navigation.setOptions({
      snapPoints: [animatedContentHeight.value],
    })
  }, [navigation, animatedContentHeight.value])

  const handleContentLayout = (event: LayoutChangeEvent) => {
    animatedContentHeight.value = event.nativeEvent.layout.height
  }

  return {
    handleContentLayout,
  }
}

export default useDynamicBottomSheetHeight
