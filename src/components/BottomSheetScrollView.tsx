import { BottomSheetScrollView as RNBottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { useState } from 'react'
import { LayoutChangeEvent, StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
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

  return (
    <RNBottomSheetScrollView
      style={{
        maxHeight: scrollEnabledContentHeight - insets.top,
        marginTop: scrollEnabled ? insets.top : 0,
      }}
      scrollEnabled={scrollEnabled}
      onLayout={handleLayout}
    >
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.container,
          { paddingTop: scrollEnabled ? 0 : Spacing.Thick24 },
          containerStyle,
        ]}
        onLayout={handleScrollEnabled}
        testID={testId}
      >
        {children}
      </SafeAreaView>
    </RNBottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
})

export default BottomSheetScrollView
