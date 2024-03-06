import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

export interface Props {
  color?: Colors
}

const ValoraV = ({ color }: Props) => (
  <Svg width={18} height={14} fill="none" testID="ValoraV">
    <Path
      fill={color}
      d="M10.494 13.667c.67-5.201 3.126-8.16 6.84-10.844L15.434.333c-2.429 1.854-5.08 4.482-6.31 8.105C8.122 5.478 6.028 2.878 2.65.333L.667 2.878C4.882 5.866 7.004 9.213 7.59 13.667h2.904Z"
    />
  </Svg>
)
export default ValoraV
