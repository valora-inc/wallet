import React from 'react'
import { ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface Props {
  width?: number
  height?: number
  color?: string
  style?: ViewStyle
}

export default function Palm({ width = 570.88, height = 319.77, color = '#CAF27A', style }: Props) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={style}>
      <Path
        d="M249.974 110.885C333.589 66.3268 394.615 61.4001 407.204 94.7831C418.859 138.325 262.485 201.055 258.486 189.292C247.74 179.622 384.096 219.752 398.143 260.649C331.777 257.203 235.235 215.141 151.197 256.863C49.0167 307.49 15.9102 423.612 0.495358 473.186C24.2145 84.5169 348.775 -149.449 249.974 110.885Z"
        fill={color}
      />
    </Svg>
  )
}
