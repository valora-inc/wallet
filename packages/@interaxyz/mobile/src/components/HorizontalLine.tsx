import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import colors from 'src/styles/colors'

export default function HorizontalLine() {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderStyle: 'solid',
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    marginTop: 10,
    marginBottom: 15,
  },
})
