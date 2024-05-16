import * as React from 'react'
import { Animated, StyleSheet, Text, TextStyle, View } from 'react-native'
import { typeScale } from 'src/styles/fonts'

interface Props {
  value: string | number
  typeScaleName?: keyof typeof typeScale
  animationDuration?: number
  disableAnimation?: boolean
  testID?: string
}

interface TickTextProps {
  textStyle: TextStyle
  value: string
}

interface TickProps {
  startValue: number
  endValue: number
  animationDuration: number
  textHeight: number
  textStyle: TextStyle
}

const numberRange = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function TickText({ value, textStyle }: TickTextProps) {
  return <Text style={[styles.tickerText, textStyle]}>{value}</Text>
}

function Tick({ startValue, endValue, textStyle, textHeight, animationDuration }: TickProps) {
  const animatedValue = new Animated.Value(startValue * textHeight * -1)
  const transformStyle = { transform: [{ translateY: animatedValue }] }
  const duration = animationDuration ?? 1300

  Animated.timing(animatedValue, {
    toValue: endValue * textHeight * -1,
    duration,
    useNativeDriver: true,
  }).start()

  return (
    <Animated.View style={transformStyle}>
      {numberRange.map((number, index) => {
        return <TickText key={index} textStyle={textStyle} value={number} />
      })}
    </Animated.View>
  )
}

export default function NumberTicker({
  value,
  typeScaleName = 'displaySmall',
  animationDuration = 1300,
  disableAnimation = false,
  testID,
}: Props) {
  const textStyle = typeScale[typeScaleName]
  const textHeight = textStyle.lineHeight
  const finalValueArray = value.toString().split('')

  // For the startValueArray, map over each character in the finalValueArray to
  // replace digits with random digits, do not change non-digit characters (e.g.
  // decimal separator)
  const startValueArray = finalValueArray.map((char) => {
    return char.match(/\d/) ? Math.floor(Math.random() * 10).toString() : char
  })

  return (
    <View style={[styles.container, { height: textHeight }]} testID={testID}>
      {finalValueArray.map((value, index) => {
        // If the character is not a digit, render it as a static text element
        if (!value.match(/\d/)) {
          return <TickText key={index} textStyle={textStyle} value={value} />
        }

        const endValue = parseInt(value, 10)
        const startValue = parseInt(startValueArray[index], 10)
        return (
          <Tick
            key={`${value}-${index}-${startValueArray[index]}`}
            startValue={startValue}
            endValue={endValue}
            textHeight={textHeight}
            textStyle={textStyle}
            animationDuration={disableAnimation ? 0 : animationDuration}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    // This negative gap is a hack to bring the numbers closer together,
    // otherwise they feel unnatural and far apart
    gap: -2,
  },
  tickerText: {
    textAlign: 'center',
  },
})
