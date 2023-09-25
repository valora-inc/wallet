import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color: Colors
}

const QuickActionsAdd = ({ color }: Props) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.8571 20V13.1429H4V10.8571H10.8571V4H13.1429V10.8571H20V13.1429H13.1429V20H10.8571Z"
      fill={color}
    />
  </Svg>
)

export default React.memo(QuickActionsAdd)
