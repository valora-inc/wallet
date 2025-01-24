import * as React from 'react'
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const StarOutline = () => (
  <Svg width={24} height={24} fill="none">
    <G clipPath="url(#a)">
      <Path
        d="m12.265 17.675 6.344 3.828-1.684-7.216 5.605-4.855-7.38-.626L12.264 2 9.381 8.806 2 9.432l5.605 4.855-1.684 7.216 6.344-3.828Z"
        fill="#FCBA27"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill={Colors.white} d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>
)

export default StarOutline
