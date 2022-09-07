import * as React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

interface Props {
  text: string
  right?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export default function SectionheadNew({ right, text, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{text}</Text>
      {right ? right : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    ...fontStyles.sectionHeader,
    fontSize: 13,
    lineHeight: 16,
    color: colors.gray4,
  },
})
