import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Checkmark from 'src/icons/Checkmark'
import fontStyles from 'src/styles/fonts'

type Props = {
  location: string
}

const ExportSuccess = ({ location }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Successfully Exported</Text>
      <View style={styles.innerContainer}>
        <Checkmark />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    height: '100%',
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
  },
})

export default ExportSuccess
