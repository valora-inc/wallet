import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import Backspace from 'src/icons/Backspace'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  onDigitPress: (digit: number) => void
  onBackspacePress: () => void
  onDecimalPress?: () => void
  onBackspaceLongPress?: () => void
  decimalSeparator?: string
  testID?: string
  digitColor?: Colors
}

function DigitButton({
  digit,
  textColor,
  onDigitPress,
}: {
  digit: number
  textColor?: Colors
  onDigitPress: (digit: number) => void
}) {
  const onPress = () => onDigitPress(digit)
  return (
    <Touchable testID={`digit${digit}`} borderless={true} onPress={onPress}>
      <Text allowFontScaling={false} style={[styles.digit, { color: textColor ?? Colors.dark }]}>
        {digit}
      </Text>
    </Touchable>
  )
}

export default function NumberKeypad(props: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <DigitButton digit={1} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
        <DigitButton digit={2} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
        <DigitButton digit={3} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
      </View>
      <View style={styles.row}>
        <DigitButton digit={4} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
        <DigitButton digit={5} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
        <DigitButton digit={6} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
      </View>
      <View style={styles.row}>
        <DigitButton digit={7} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
        <DigitButton digit={8} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
        <DigitButton digit={9} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
      </View>
      <View style={styles.row}>
        {props.decimalSeparator && props.onDecimalPress ? (
          <Touchable
            borderless={true}
            onPress={props.onDecimalPress}
            testID={`digit${props.decimalSeparator}`}
          >
            <Text style={styles.digit}>{props.decimalSeparator}</Text>
          </Touchable>
        ) : (
          <View style={styles.digit} />
        )}
        <DigitButton digit={0} onDigitPress={props.onDigitPress} textColor={props.digitColor} />
        <Touchable
          testID="Backspace"
          borderless={true}
          onPress={props.onBackspacePress}
          onLongPress={props.onBackspaceLongPress}
        >
          <View style={[styles.digit]}>
            <Backspace color={props.digitColor ?? Colors.dark} />
          </View>
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  digit: {
    ...fontStyles.largeNumber,
    width: 64,
    padding: 24,
    fontSize: 22,
    lineHeight: 28,
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
  },
})
