/**
 * A button that's just text. For ann underlined text link, see Link.tsx
 */

import * as React from 'react'
import { StyleSheet } from 'react-native'
import BorderlessButton, { Props } from 'src/components/BorderlessButton'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

export default function TextButton({ style, ...passThroughProps }: Props) {
  return (
    <BorderlessButton {...passThroughProps} style={style ? [styles.text, style] : styles.text} />
  )
}

const styles = StyleSheet.create({
  text: {
    ...typeScale.labelSemiBoldMedium,
    color: colors.primary,
  },
})
