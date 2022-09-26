import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StackScreenProps } from '@react-navigation/stack'
import { StackParamList } from 'src/navigator/types'
import { Screens } from 'src/navigator/Screens'

type Props = StackScreenProps<StackParamList, Screens.KycExpired>

// TODO implement designs:
// https://www.figma.com/file/bwIY7peeykI8K4wTrXs4iN/Fiat-Connect?node-id=2945%3A41941
function KycExpired(_props: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text>KYC Expired</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
})

export default KycExpired
