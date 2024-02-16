import * as React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'
import { getSizing } from '../styles/accessibility'

interface Props {
  color?: string
  height?: number
  strokeWidth?: number
  style?: StyleProp<ViewStyle>
}

export default function DownArrowIcon({
  height,
  color = colors.gray3,
  strokeWidth = 1,
  style = {},
}: Props) {
  return (
    <Svg
      width={getSizing(height)}
      height={getSizing(height)}
      strokeWidth={strokeWidth}
      viewBox="0 0 16 16"
      fill="none"
      testID="downArrowIcon"
      style={style}
    >
      <Path d="M3 6l5 5 5-5" stroke={color} />
    </Svg>
  )
}
