import * as React from 'react'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import ReactNativeModal from 'react-native-modal'
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context'
import Card from 'src/components/Card'
import colors from 'src/styles/colors'

interface Props {
  children: React.ReactNode
  isVisible: boolean
  style?: StyleProp<ViewStyle>
  modalStyle?: StyleProp<ViewStyle>
  testID?: string
  onBackgroundPress?: () => void
  onModalHide?: () => void
}

export default function Modal({
  children,
  isVisible,
  style,
  modalStyle,
  testID,
  onBackgroundPress,
  onModalHide,
}: Props) {
  const { height } = useSafeAreaFrame()

  return (
    <ReactNativeModal
      testID={testID}
      style={modalStyle}
      isVisible={isVisible}
      backdropOpacity={0.1}
      onBackdropPress={onBackgroundPress}
      // The default uses `Dimensions.get('window').height` but sometimes reports an incorrect height on Android
      // `useSafeAreaFrame()` seems to work better
      deviceHeight={height}
      statusBarTranslucent={true}
      onModalHide={onModalHide}
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
    backgroundColor: colors.white,
    padding: 24,
    maxHeight: '100%',
  },
})
