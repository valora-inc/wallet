import { BottomSheetScrollView as GorhomBottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { useState } from 'react'
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  containerStyle?: StyleProp<ViewStyle>
  testId?: string
  forwardedRef?: React.RefObject<ScrollView>
  isScreen?: boolean
  children: React.ReactNode
}

function BottomSheetScrollView({
  forwardedRef,
  containerStyle,
  testId,
  isScreen,
  children,
}: Props) {
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)

  const insets = useSafeAreaInsets()
  const scrollEnabled = contentHeight > containerHeight

  // Note: scrolling views inside bottom sheet screens should use the relevant
  // components from react-native-gesture-handler instead of directly from
  // react-native, otherwise they do not scroll correctly. This isScreen prop
  // should be set to true if the bottom sheet is registered as screen in the
  // Navigator. It is still handy for screens and components to share this
  // component for the styling and layout logic.
  // https://github.com/osdnk/react-native-reanimated-bottom-sheet/issues/264#issuecomment-674757545
  const ScrollViewComponent = isScreen ? ScrollView : GorhomBottomSheetScrollView
  // use max height simulate max 90% snap point for screens. when bottom sheets
  // take up the whole screen, it is no longer obvious that they are a bottom
  // sheet / how to navigate away
  const maxHeight = isScreen ? variables.height * 0.9 : undefined

  return (
    <ScrollViewComponent
      ref={forwardedRef}
      scrollEnabled={scrollEnabled}
      style={{ maxHeight }}
      onLayout={(event: LayoutChangeEvent) => {
        setContainerHeight(event.nativeEvent.layout.height)
      }}
      keyboardShouldPersistTaps="always"
    >
      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, Spacing.Thick24) },
          containerStyle,
        ]}
        onLayout={(event: LayoutChangeEvent) => {
          setContentHeight(event.nativeEvent.layout.height)
        }}
        testID={testId}
      >
        {children}
      </View>
    </ScrollViewComponent>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
})

export default BottomSheetScrollView
