import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  color?: string
  size?: number
}

const ValoraV = ({ color, size }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      fill={color}
      d="M11.844 15.809c.603-4.704 2.814-7.38 6.156-9.807L16.291 3.75c-2.186 1.676-4.572 4.053-5.678 7.33-.904-2.677-2.789-5.028-5.83-7.33L3 6.052c3.794 2.702 5.704 5.729 6.231 9.757h2.613Z"
    />
  </Svg>
)
export default ValoraV
