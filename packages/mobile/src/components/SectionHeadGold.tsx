import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  text: string
}

function SectionHead({ text }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  text: {
    ...fontStyles.h2,
    color: colors.dark,
  },
})

export default SectionHead
