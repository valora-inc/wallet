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
  percentageTextStyle = fontStyles.small,
  suffixText,
  suffixTextStyle = fontStyles.small,
  DownIcon = DownIndicator,
  UpIcon = UpIndicator,
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
    color = Colors.primary
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
