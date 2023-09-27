import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import DownIndicator from 'src/icons/DownIndicator'
import UpIndicator from 'src/icons/UpIndicator'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

type IconComponentType = React.ComponentType<{ color?: Colors; testID?: string }>

interface Props {
  testID?: string
  comparedValue: BigNumber.Value
  currentValue: BigNumber.Value
  textStyle?: TextStyle
  DownIcon?: IconComponentType
  UpIcon?: IconComponentType
}

function usePercentageInfo(
  comparedValue: BigNumber,
  currentValue: BigNumber,
  DownIcon: IconComponentType,
  UpIcon: IconComponentType,
  testID: string
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
        indicator: <DownIcon color={Colors.warning} testID={`${testID}:DownIndicator`} />,
        style: styles.decreasedText,
        percentageString,
      }
    case 1:
      return {
        indicator: <UpIcon color={Colors.greenUI} testID={`${testID}:UpIndicator`} />,
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

function PercentageIndicator({
  comparedValue,
  currentValue,
  testID = 'PercentageIndicator',
  DownIcon = DownIndicator,
  UpIcon = UpIndicator,
  textStyle = fontStyles.small,
}: Props) {
  const { indicator, style, percentageString } = usePercentageInfo(
    new BigNumber(comparedValue),
    new BigNumber(currentValue),
    DownIcon,
    UpIcon,
    testID
  )

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.indicator}>{indicator}</View>
      <Text style={[textStyle, style]}>{percentageString}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  indicator: {
    justifyContent: 'center',
    marginRight: 4,
  },
  increasedText: {
    color: Colors.greenUI,
  },
  decreasedText: {
    color: Colors.warning,
  },
  noChangeText: {
    color: Colors.gray4,
  },
})

export default PercentageIndicator
