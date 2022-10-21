// HOC to add a paste button to a text input
import * as React from 'react'
import { StyleSheet, TextInputProps, View } from 'react-native'
import TouchableDefault from 'src/components/Touchable'
import { PasteAwareWrappedElementProps, withPasteAware } from 'src/components/WithPasteAware'
import Paste from 'src/icons/Paste'
import Search from 'src/icons/Search'
import colors from 'src/styles/colors'

const HEIGHT = 36

export default function withTextSearchPasteAware<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>
) {
  class Wrapper extends React.Component<P & PasteAwareWrappedElementProps> {
    render() {
      const { style, isPasteIconVisible, onPressPaste, leftIcon } = this.props
      const iconToUse = leftIcon ?? <Search />
      return (
        <View style={[styles.container, style]}>
          <View style={styles.searchIconContainer}>{iconToUse}</View>
          <WrappedTextInput
            {...this.props}
            inputStyle={styles.input}
            testID="SearchInput"
            showClearButton={!isPasteIconVisible}
          />
          {isPasteIconVisible && (
            <TouchableDefault onPress={onPressPaste}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderColor: colors.gray2,
    borderWidth: 1.5,
    paddingRight: 8,
  },
  searchIconContainer: {
    marginLeft: 17,
    marginRight: 13,
  },
  input: {
    paddingVertical: 6,
  },
})
