import { BottomSheetScrollView as RNBottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { useEffect, useState } from 'react'
import { Keyboard, LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacing } from 'src/styles/styles'

interface Props {
  containerStyle?: StyleProp<ViewStyle>
  testId?: string
  children: React.ReactNode
}

function BottomSheetScrollView({ containerStyle, testId, children }: Props) {
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)

  const insets = useSafeAreaInsets()
  const scrollEnabled = contentHeight > containerHeight

  // Dismiss keyboard on mount
  useEffect(() => {
    Keyboard.dismiss()
  }, [])

  return (
    <RNBottomSheetScrollView
      scrollEnabled={scrollEnabled}
      onLayout={(event: LayoutChangeEvent) => {
        setContainerHeight(event.nativeEvent.layout.height)
      }}
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
    </RNBottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
})

export default BottomSheetScrollView
