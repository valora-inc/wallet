import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import DataDown from 'src/icons/DataDown'
import DataUp from 'src/icons/DataUp'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

type IconComponentType = React.ComponentType<{ color?: Colors; testID?: string }>

interface Props {
  testID?: string
  comparedValue: BigNumber.Value
  currentValue: BigNumber.Value
  percentageTextStyle?: TextStyle
  suffixText?: string
  suffixTextStyle?: TextStyle
  DownIcon?: IconComponentType
  UpIcon?: IconComponentType
  NoChangeIcon?: IconComponentType
}

function PercentageIndicator({
  comparedValue,
  currentValue,
  testID = 'PercentageIndicator',
  percentageTextStyle = typeScale.bodySmall,
  suffixText,
  suffixTextStyle = typeScale.bodySmall,
  DownIcon = DataDown,
  UpIcon = DataUp,
  NoChangeIcon,
}: Props) {
  const percentage = new BigNumber(currentValue)
    .dividedBy(new BigNumber(comparedValue))
    .multipliedBy(100)
    .minus(100)
  const comparison = percentage.comparedTo(0)
  const percentageString = `${percentage.abs().toFixed(2)}%`

  let indicator: React.ReactElement | undefined
  let color: Colors

  if (comparison > 0) {
    color = Colors.accent
    indicator = <UpIcon color={color} testID={`${testID}:UpIndicator`} />
  } else if (comparison < 0) {
    color = Colors.error
    indicator = <DownIcon color={color} testID={`${testID}:DownIndicator`} />
  } else {
    color = Colors.gray3
    indicator = NoChangeIcon && (
      <NoChangeIcon color={color} testID={`${testID}:NoChangeIndicator`} />
    )
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.indicator}>{indicator}</View>
      <Text style={[percentageTextStyle, { color }]}>{percentageString}</Text>
      {!!suffixText && <Text style={[suffixTextStyle, { color }]}>{suffixText}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    justifyContent: 'center',
  },
})

export default PercentageIndicator
