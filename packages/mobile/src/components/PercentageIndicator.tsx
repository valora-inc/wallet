import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text } from 'react-native'

interface Props {
  comparedValue: BigNumber.Value
  currentValue: BigNumber.Value
}

function getStyleAndText(percentage: BigNumber) {
  const comparison = percentage.comparedTo(0)
  const percentageString = percentage.abs().toFixed(2)
  switch (comparison) {
    case -1:
      return { style: styles.decreasedText, text: `▾ ${percentageString}%` }
    case 1:
      return { style: styles.increasedText, text: `▴ ${percentageString}%` }
    case 0:
    default:
      return { style: styles.noChangeText, text: `- ${percentageString}%` }
  }
}

function PercentageIndicator({ comparedValue, currentValue }: Props) {
  const comparedValueBN = new BigNumber(comparedValue)
  const currentValueBN = new BigNumber(currentValue)
  const percentage = currentValueBN.dividedBy(comparedValueBN).multipliedBy(100).minus(100)

  const { style, text } = getStyleAndText(percentage)

  return <Text style={style}>{text}</Text>
}

const styles = StyleSheet.create({
  increasedText: {
    ...fontStyles.small,
    color: Colors.greenUI,
  },
  decreasedText: {
    ...fontStyles.small,
    color: Colors.warning,
  },
  noChangeText: {
    ...fontStyles.small,
    color: Colors.gray4,
  },
})

export default PercentageIndicator
