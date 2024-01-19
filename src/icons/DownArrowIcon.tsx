import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'
import { getSizing } from '../styles/accessibility'

interface Props {
  color?: string
  height?: number
}

export default function DownArrowIcon({ height, color = colors.gray3 }: Props) {
  return (
    <Svg
      width={getSizing(height)}
      height={getSizing(height)}
      viewBox="0 0 16 16"
      fill="none"
      testID="downArrowIcon"
    >
      <Path d="M3 6l5 5 5-5" stroke={color} />
    </Svg>
  )
}
