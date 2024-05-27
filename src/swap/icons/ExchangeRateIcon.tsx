import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors, { Colors } from 'src/styles/colors'

interface Props {
  size?: number
  color?: colors
}

const ExchangeRateIcon = ({ size = 16, color = Colors.gray3 }: Props) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 16 16">
    <Path
      fill={color}
      d="m4.667 14-3.334-3.333 3.334-3.334.95.934L3.883 10H14v1.333H3.883l1.734 1.734-.95.933Zm6.666-5.333-.95-.934L12.117 6H2V4.667h10.117l-1.734-1.734.95-.933 3.334 3.333-3.334 3.334Z"
    />
  </Svg>
)
export default ExchangeRateIcon
