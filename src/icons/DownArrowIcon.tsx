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
      width={getSizing(height, 24)}
      height={getSizing(height, 24)}
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      fill="none"
      testID="downArrowIcon"
      style={style}
    >
      <Path
        fill={color}
        stroke={color}
        d="m16.59 8.707.703.703L12 14.703 6.707 9.41l.703-.703 4.237 4.227.353.352.353-.352 4.237-4.227Z"
      />
    </Svg>
  )
}
