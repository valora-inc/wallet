import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color?: Colors
  size?: number
}

const ArrowRight = ({ color = Colors.greenUI, size = 24 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      d="m9.333 12-.933-.967 2.367-2.366h-8.1V7.333h8.1L8.4 4.967 9.333 4l4 4-4 4Z"
      fill={color}
    />
  </Svg>
)

export default ArrowRight
