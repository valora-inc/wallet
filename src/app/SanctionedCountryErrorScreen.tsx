import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import fontStyles from 'src/styles/fonts'

class SanctionedCountryErrorScreen extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.errorMessage}>{'Sorry, Valora is not support in your location'}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  errorMessage: {
    ...fontStyles.regular,
  },
})

export default SanctionedCountryErrorScreen
