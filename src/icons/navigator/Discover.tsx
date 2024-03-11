import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  color?: string
  size?: number
}

const Discover = ({ color, size }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      fill={color}
      d="M15.417 14.492a1.672 1.672 0 0 0-1.584-1.159H13v-2.5a.833.833 0 0 0-.833-.833h-5V8.333h1.666a.833.833 0 0 0 .834-.833V5.833h1.666A1.667 1.667 0 0 0 13 4.167v-.342a6.654 6.654 0 0 1 2.417 10.667Zm-5.75 2.116A6.657 6.657 0 0 1 3.833 10c0-.517.067-1.017.175-1.492L8 12.5v.833A1.667 1.667 0 0 0 9.667 15M10.5 1.667a8.333 8.333 0 1 0 0 16.666 8.333 8.333 0 0 0 0-16.666Z"
    />
  </Svg>
)
export default Discover
