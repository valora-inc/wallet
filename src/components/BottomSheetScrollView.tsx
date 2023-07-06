import { BottomSheetScrollView as RNBottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { useEffect, useState } from 'react'
import { Keyboard, LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetParams } from 'src/navigator/types'
import { Spacing } from 'src/styles/styles'

interface Props extends BottomSheetParams {
  containerStyle?: StyleProp<ViewStyle>
  testId?: string
  children: React.ReactNode
}

const BOTTOM_SHEET_DEFAULT_HANDLE_HEIGHT = 24

function BottomSheetScrollView({ handleContentLayout, containerStyle, testId, children }: Props) {
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const { height } = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

  const scrollEnabledContentHeight = height - BOTTOM_SHEET_DEFAULT_HANDLE_HEIGHT

  const handleLayout = (event: LayoutChangeEvent) => {
    handleContentLayout(event)
  }

  const handleScrollEnabled = (event: LayoutChangeEvent) => {
    if (event.nativeEvent.layout.height > scrollEnabledContentHeight) {
      setScrollEnabled(true)
    }
  }

  // Dismiss keyboard on mount
  useEffect(() => {
    Keyboard.dismiss()
  }, [])

  return (
    <RNBottomSheetScrollView
      style={{
        maxHeight: scrollEnabledContentHeight - insets.top,
      }}
      scrollEnabled={scrollEnabled}
      onLayout={handleLayout}
    >
      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, Spacing.Thick24) },
          containerStyle,
        ]}
        onLayout={handleScrollEnabled}
        testID={testId}
      >
        {children}
      </View>
    </RNBottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
})

export default BottomSheetScrollView
