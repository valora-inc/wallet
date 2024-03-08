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
  isScreen?: boolean // should be set to true if using this component directly from a component that is registered as a native bottom sheet screen on the navigator
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

  // the BottomSheetScrollView component from @gorhom/bottom-sheet does not
  // scroll correctly when it is the root component of a native bottom sheet on
  // the navigator (i.e. a bottom sheet screen). This is a workaround to enable
  // scrolling using a ScrollView from react-native-safe-area-context when the
  // content is large enough to require scrolling. The downside of using this
  // ScrollView is the bottom sheet gestures are not enabled (so you cannot
  // overscroll to dismiss)
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
