import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color: Colors
}

const QuickActionsSend = ({ color }: Props) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.00889 20L21.6667 12L3.00889 4L3 10.2222L16.3333 12L3 13.7778L3.00889 20Z"
      fill={color}
    />
  </Svg>
)

export default React.memo(QuickActionsSend)
