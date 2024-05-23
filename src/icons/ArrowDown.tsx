import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { Colors } from 'src/styles/colors'

interface Props {
  color?: Colors
  size?: number
}

const ArrowDown = ({ color = Colors.black, size = 24 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      id="Vector"
      d="M11.053 4.5L12.947 4.5L12.947 15.8636L18.1553 10.6553L19.5 12L12 19.5L4.5 12L5.8447 10.6553L11.053 15.8636L11.053 4.5Z"
      fill={color}
    />
  </Svg>
)

export default React.memo(ArrowDown)
