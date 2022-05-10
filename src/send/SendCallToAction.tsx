import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface SendCTAProps {
  icon: React.ReactElement
  header: string
  body: string
  cta: string
  onPressCta: () => void
}

// A CTA 'card' embedded in the Send screen list
export function SendCallToAction(props: SendCTAProps) {
  return (
    <View style={styles.container}>
      {props.icon}
      <View style={styles.textContainer}>
        <Text style={fontStyles.small500}>{props.header}</Text>
        <Text style={styles.bodyText}>{props.body}</Text>
        <TextButton onPress={props.onPressCta}>{props.cta}</TextButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.gray1,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  bodyText: {
    ...fontStyles.small,
    marginVertical: 10,
  },
})
