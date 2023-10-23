import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color?: Colors
  size?: number
}

const ArrowRight = ({ color = Colors.greenUI, size = 18 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <Path
      d="M1 9h16m0 0-7-8m7 8-7 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
)

export default ArrowRight
