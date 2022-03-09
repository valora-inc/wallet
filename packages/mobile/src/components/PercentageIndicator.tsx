import DownIndicator from '@celo/react-components/icons/DownIndicator'
import UpIndicator from '@celo/react-components/icons/UpIndicator'
import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, TextStyle, View } from 'react-native'

interface Props {
  testID?: string
  comparedValue: BigNumber.Value
  currentValue: BigNumber.Value
}

function usePercentageInfo(
  comparedValue: BigNumber,
  currentValue: BigNumber,
  testID?: string
): {
  indicator?: React.ReactElement
  style: TextStyle
  percentageString: string
} {
  const percentage = currentValue.dividedBy(comparedValue).multipliedBy(100).minus(100)
  const comparison = percentage.comparedTo(0)
  const percentageString = `${percentage.abs().toFixed(2)}%`
  switch (comparison) {
    case -1:
      return {
        indicator: <DownIndicator testID={`${testID}:DownIndicator`} />,
        style: styles.decreasedText,
        percentageString,
      }
    case 1:
      return {
        indicator: <UpIndicator testID={`${testID}:UpIndicator`} />,
        style: styles.increasedText,
        percentageString,
      }
    case 0:
    default:
      return {
        style: styles.noChangeText,
        percentageString,
      }
  }
}

function PercentageIndicator({ comparedValue, currentValue, testID }: Props) {
  const { indicator, style, percentageString } = usePercentageInfo(
    new BigNumber(comparedValue),
    new BigNumber(currentValue),
    testID
  )

  return (
    <View style={{ flexDirection: 'row' }} testID={testID}>
      <View style={{ padding: 6 }}>{indicator}</View>
      <Text style={style}>{percentageString}</Text>
    </View>
  )
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
