import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

const HomeActionsRequest = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M18 18V16L9.41 16L19 6.41L17.59 5L8 14.59L8 6H6L6 18H18Z" fill="#178154" />
  </Svg>
)

export default React.memo(HomeActionsRequest)
