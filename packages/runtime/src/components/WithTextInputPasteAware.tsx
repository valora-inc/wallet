// HOC to add a paste button to a text input

import * as React from 'react'
import { StyleSheet, TextInputProps, View, ViewStyle } from 'react-native'
import TouchableDefault from 'src/components/Touchable'
import { PasteAwareWrappedElementProps, withPasteAware } from 'src/components/WithPasteAware'
import Paste from 'src/icons/Paste'
import Colors from 'src/styles/colors'
import { iconHitslop } from 'src/styles/variables'

export default function withTextInputPasteAware<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>,
  pasteIconContainerStyle?: ViewStyle
) {
  class Wrapper extends React.Component<P & PasteAwareWrappedElementProps> {
    render() {
      const { isPasteIconVisible, onPressPaste } = this.props
      return (
        <View style={styles.container}>
          <WrappedTextInput {...this.props} showClearButton={!isPasteIconVisible} />
          {isPasteIconVisible && (
            <TouchableDefault
              style={[styles.pasteIconContainer, pasteIconContainerStyle]}
              onPress={onPressPaste}
              hitSlop={iconHitslop}
            >
              <Paste />
            </TouchableDefault>
          )}
        </View>
      )
    }
  }
  return withPasteAware(Wrapper)
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pasteIconContainer: {
    backgroundColor: Colors.white,
    position: 'absolute',
    right: 11,
    top: 13,
    padding: 4,
    width: 20,
    height: 25,
    zIndex: 100,
  },
})
