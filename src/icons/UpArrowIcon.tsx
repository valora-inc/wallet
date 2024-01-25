import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'
import { getSizing } from '../styles/accessibility'

interface Props {
  color?: string
  height?: number
  strokeWidth?: number
}

export default function UpArrowIcon({ height, color = colors.gray3, strokeWidth = 1 }: Props) {
  return (
    <Svg
      width={getSizing(height)}
      height={getSizing(height)}
      strokeWidth={strokeWidth}
      viewBox="0 0 16 16"
      fill="none"
      testID="upArrowIcon"
    >
      <Path d="M3 10l5-5 5 5" stroke={color} />
    </Svg>
  )
}
