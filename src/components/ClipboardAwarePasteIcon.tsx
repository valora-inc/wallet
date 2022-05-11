// VIEW Paste icon that disappears when the |currentValue| passed matches the content
// of the clipboard.

import React from 'react'
import { StyleProp, ViewProps, ViewStyle } from 'react-native'
import { isAddressFormat } from 'src/account/utils'
import Touchable from 'src/components/Touchable'
import { PasteAwareWrappedElementProps, withPasteAware } from 'src/components/WithPasteAware'
import Paste from 'src/icons/Paste'
import { iconHitslop } from 'src/styles/variables'

interface PasteAwareProps {
  style?: StyleProp<ViewStyle>
  color: string
  testID?: string
  onChangeText: (text: string) => void
  value: string
}

export default function ClipboardAwarePasteIcon({
  style,
  color,
  testID,
  ...otherProps
}: PasteAwareProps) {
  class Wrapper extends React.Component<ViewProps & PasteAwareWrappedElementProps> {
    render() {
      const { isPasteIconVisible, onPressPaste } = this.props
      if (!isPasteIconVisible) {
        return null
      }
      return (
        <Touchable testID={testID} style={style} onPress={onPressPaste} hitSlop={iconHitslop}>
          <Paste width={32} height={32} color={color} />
        </Touchable>
      )
    }
  }

  const Icon = withPasteAware(Wrapper)
  return <Icon shouldShowClipboard={isAddressFormat} {...otherProps} />
}
