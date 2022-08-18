import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

class SanctionedCountryErrorScreen extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.errorMessage}>{'Sorry, Valora is not supported in your location'}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: Spacing.Regular16,
  },
  errorMessage: {
    ...fontStyles.regular,
  },
})

export default SanctionedCountryErrorScreen
