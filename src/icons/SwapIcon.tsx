import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

const SwapIcon = () => (
  <Svg width={40} height={40} fill="none">
    <Circle cx={20} cy={20} r={20} fill="#F8F9F9" />
    <Path
      d="M27 26V13m0 0-4 4m4-4 4 4M14 13v13m0 0 4-4m-4 4-4-4"
      stroke="#B4B9BD"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default SwapIcon
