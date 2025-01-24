import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button, { BtnTypes } from 'src/components/Button'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import variables from 'src/styles/variables'

export interface Props {
  title: string
  CTAText: string
  CTAHandler: () => void
  subtitle?: string | null
  children?: React.ReactNode
}

class FullscreenCTA extends React.PureComponent<Props> {
  render() {
    const { title, subtitle, CTAText, CTAHandler } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={typeScale.titleMedium}>{title}</Text>
          <Text style={typeScale.titleSmall}>{subtitle}</Text>
        </View>
        {this.props.children}
        <View style={styles.button}>
          <Button
            onPress={CTAHandler}
            text={CTAText}
            type={BtnTypes.PRIMARY}
            testID="ErrorContinueButton"
          />
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    height: variables.height,
    width: variables.width,
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 120,
  },
  button: { alignItems: 'center' },
})

export default FullscreenCTA
