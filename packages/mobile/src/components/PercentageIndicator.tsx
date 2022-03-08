import DownIndicator from '@celo/react-components/icons/DownIndicator'
import UpIndicator from '@celo/react-components/icons/UpIndicator'
import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  testID?: string
  comparedValue: BigNumber.Value
  currentValue: BigNumber.Value
}

function renderPercentage(percentage: BigNumber, testID?: string) {
  const comparison = percentage.comparedTo(0)
  const percentageString = percentage.abs().toFixed(2)
  let style
  let indicator: any
  switch (comparison) {
    case -1:
      style = styles.decreasedText
      indicator = <DownIndicator testID={`${testID}:DownIndicator`} />
      break
    case 1:
      style = styles.increasedText
      indicator = <UpIndicator testID={`${testID}:UpIndicator`} />
      break
    case 0:
    default:
      style = styles.noChangeText
      break
  }

  return (
    <View style={{ flexDirection: 'row' }} testID={testID}>
      <View style={{ padding: 6 }}>{indicator}</View>
      <Text style={style}>{percentageString}%</Text>
    </View>
  )
}

function PercentageIndicator({ comparedValue, currentValue, testID }: Props) {
  const comparedValueBN = new BigNumber(comparedValue)
  const currentValueBN = new BigNumber(currentValue)
  const percentage = currentValueBN.dividedBy(comparedValueBN).multipliedBy(100).minus(100)

  return renderPercentage(percentage, testID)
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
