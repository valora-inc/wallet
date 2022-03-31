/**
 * An underlined text link. For a button that's just text, see TextButton.tsx
 */

import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native'
import Touchable, { Props as TouchableProps } from 'src/components/Touchable'
import fontStyles from 'src/styles/fonts'

type Props = Omit<TouchableProps, 'style'> & {
  style?: StyleProp<TextStyle>
}

export default function Link(props: Props) {
  const { style: customStyle, children, ...passThroughProps } = props
  return (
    <Touchable {...passThroughProps} borderless={true}>
      <Text style={[styles.text, customStyle]}>{children}</Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.small,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
})
