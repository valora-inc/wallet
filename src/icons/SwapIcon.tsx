import * as React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import Colors from 'src/styles/colors'

const SwapIcon = () => (
  <Svg width={40} height={40} fill="none">
    <Rect width={40} height={40} fill={Colors.successLight} rx={20} />
    <Path
      fill={Colors.successDark}
      stroke={Colors.successDark}
      d="M23.722 25.567v.5h2.624l-3.235 3.227-3.235-3.227H22.5v-7.79h1.222v7.29Zm-7.889-11.134v-.5H13.21l3.235-3.227 3.236 3.227h-2.624v7.79h-1.223v-7.29Z"
    />
  </Svg>
)

export default SwapIcon
