import * as React from 'react'
import { ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface Props {
  width?: number
  height?: number
  style?: ViewStyle
}

const WaveCurve = ({ width = 344, height = 119, style }: Props) => (
  <Svg fill="none" width={width} height={height} viewBox="0 0 344 119" style={style}>
    <Path
      fill="#6E75F0"
      d="M344 123.959S289.225-22.478 213.25 45.725C137.287 113.927 162.276-3.447 91.896.078 21.516 3.604 8.089 44.831-100 126l444-2.041Z"
    />
  </Svg>
)

export default WaveCurve
