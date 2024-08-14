import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const PlusIcon = () => (
  <Svg width={24} height={24} fill="none" viewBox="0 0 24 24">
    <Path
      d="M19 12.998H13V18.998H11V12.998H5V10.998H11V4.99805H13V10.998H19V12.998Z"
      fill={Colors.black}
    />
  </Svg>
)

export default PlusIcon
