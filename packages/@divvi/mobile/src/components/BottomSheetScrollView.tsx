import { BottomSheetScrollView as GorhomBottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { useState } from 'react'
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacing } from 'src/styles/styles'

interface Props {
  containerStyle?: StyleProp<ViewStyle>
  testId?: string
  forwardedRef?: React.RefObject<ScrollView>
  children: React.ReactNode
}

function BottomSheetScrollView({ forwardedRef, containerStyle, testId, children }: Props) {
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)

  const insets = useSafeAreaInsets()
  const scrollEnabled = contentHeight > containerHeight

  return (
    <GorhomBottomSheetScrollView
      ref={forwardedRef}
      scrollEnabled={scrollEnabled}
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
    </GorhomBottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
})

export default BottomSheetScrollView
