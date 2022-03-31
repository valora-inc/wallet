import React from 'react'
import { StyleSheet, View } from 'react-native'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'

export default function ItemSeparator() {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    backgroundColor: colors.gray2,
    marginHorizontal: variables.contentPadding,
  },
})
