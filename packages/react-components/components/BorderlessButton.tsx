import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'

export type Props = Omit<TouchableProps, 'style'> & {
  style?: StyleProp<TextStyle>
  notScaleFont?: Boolean
}

// unstyled Touchable Text, good for making other Text Buttons such as TopBarButton
export default function BorderlessButton(props: Props) {
  const { style, children, notScaleFont, ...passThroughProps } = props
  return (
    <Touchable {...passThroughProps} borderless={true}>
      {Boolean(notScaleFont) ? (
        <Text allowFontScaling={false} style={style}>
          {children}
        </Text>
      ) : (
        <Text style={style}>{children}</Text>
      )}
    </Touchable>
  )
}
