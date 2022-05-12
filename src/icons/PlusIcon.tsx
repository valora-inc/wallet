import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

const PlusIcon = () => (
  <Svg width={12} height={12} fill="none">
    <Path
      d="M6.667.667a.667.667 0 0 0-1.334 0v4.666H.667a.667.667 0 0 0 0 1.334h4.666v4.666a.667.667 0 1 0 1.334 0V6.667h4.666a.667.667 0 1 0 0-1.334H6.667V.667Z"
      fill="#2E3338"
    />
  </Svg>
)

export default PlusIcon
