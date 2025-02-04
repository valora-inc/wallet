import * as React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import variables from 'src/styles/variables'

interface Props {
  text: string
  style?: StyleProp<ViewStyle>
}

export default function SectionHead({ text, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundPrimary,
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    ...typeScale.labelSmall,
    color: colors.contentSecondary,
  },
})
