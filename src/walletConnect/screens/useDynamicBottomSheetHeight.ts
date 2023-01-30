import { BottomSheetNavigationProp } from '@th3rdwave/react-navigation-bottom-sheet'
import { useLayoutEffect, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { StackParamList } from 'src/navigator/types'

const useDynamicBottomSheetHeight = (navigation: BottomSheetNavigationProp<StackParamList>) => {
  const [contentHeight, setContentHeight] = useState(1)

  useLayoutEffect(() => {
    navigation.setOptions({
      snapPoints: [contentHeight],
      contentHeight: contentHeight,
    })
  }, [navigation, contentHeight])

  const handleContentLayout = (event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height)
  }

  return {
    handleContentLayout,
  }
}

export default useDynamicBottomSheetHeight
