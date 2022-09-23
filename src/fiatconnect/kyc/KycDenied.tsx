import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StackScreenProps } from '@react-navigation/stack'
import { StackParamList } from 'src/navigator/types'
import { Screens } from 'src/navigator/Screens'

type Props = StackScreenProps<StackParamList, Screens.KycDenied>

// TODO implement designs:
// (retryable): https://www.figma.com/file/bwIY7peeykI8K4wTrXs4iN/Fiat-Connect?node-id=2887%3A41469
// (final attempt): https://www.figma.com/file/bwIY7peeykI8K4wTrXs4iN/Fiat-Connect?node-id=2885%3A41683
function KycDenied({}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text>KYC Denied</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
})

export default KycDenied
