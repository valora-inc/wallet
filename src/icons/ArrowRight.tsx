import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: colors
}

const ArrowRight = ({ color = colors.greenUI }: Props) => (
  <Svg width={18} height={18} fill="none">
    <Path
      d="M1 9h16m0 0-7-8m7 8-7 8"
      stroke="#1AB775"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
)

export default ArrowRight
