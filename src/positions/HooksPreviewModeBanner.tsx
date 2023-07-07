import React from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import Touchable from 'src/components/Touchable'
import { hooksPreviewApiUrlSelector } from 'src/positions/selectors'
import { previewModeDisabled } from 'src/positions/slice'

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView)

export default function HooksPreviewModeBanner() {
  const hooksPreviewApiUrl = useSelector(hooksPreviewApiUrlSelector)
  const dispatch = useDispatch()

  if (!hooksPreviewApiUrl) {
    return null
  }

  return (
    // <View
    <AnimatedSafeAreaView
      style={styles.container}
      edges={['top']}
      entering={SlideInUp}
      exiting={SlideOutUp}
    >
      <Touchable
        onPress={() => dispatch(previewModeDisabled())}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Text style={styles.text}>Hooks Preview enabled, tap to disable</Text>
      </Touchable>
    </AnimatedSafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    backgroundColor: 'orange',
    // padding: 10,
  },
  text: {
    // color: 'white',
    // color: colors.white,
    // fontSize: 16,
    // fontWeight: '500',
    textAlign: 'center',
  },
})
