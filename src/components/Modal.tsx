import * as React from 'react'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import ReactNativeModal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from 'src/components/Card'
import colors from 'src/styles/colors'

interface Props {
  children: React.ReactNode
  isVisible: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  onBackgroundPress?: () => void
}

export default function Modal({ children, isVisible, style, testID, onBackgroundPress }: Props) {
  return (
    <ReactNativeModal
      testID={testID}
      isVisible={isVisible}
      backdropOpacity={0.1}
      onBackdropPress={onBackgroundPress}
      // @ts-ignore statusBarTranslucent is supported since RN 0.62, but updated lib with the added prop hasn't been published yet
      statusBarTranslucent={true}
    >
      <SafeAreaView>
        <Card style={[styles.root, style]} rounded={true}>
          {children}
        </Card>
      </SafeAreaView>
    </ReactNativeModal>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.light,
    padding: 24,
    maxHeight: '100%',
  },
})
