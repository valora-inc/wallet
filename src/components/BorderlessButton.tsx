import * as React from 'react'
import { StyleProp, Text, TextStyle, ViewStyle } from 'react-native'
import Touchable, { Props as TouchableProps } from 'src/components/Touchable'

export type Props = Omit<TouchableProps, 'style'> & {
  style?: StyleProp<TextStyle>
  containerStyle?: StyleProp<ViewStyle>
  notScaleFont?: Boolean
}

// unstyled Touchable Text, good for making other Text Buttons such as TopBarButton
export default function BorderlessButton(props: Props) {
  const { style, containerStyle, children, notScaleFont, ...passThroughProps } = props
  return (
    <Touchable {...passThroughProps} borderless={true} style={containerStyle}>
      {notScaleFont ? (
        <Text allowFontScaling={false} style={style}>
          {children}
        </Text>
      ) : (
        <Text style={style}>{children}</Text>
      )}
    </Touchable>
  )
}
