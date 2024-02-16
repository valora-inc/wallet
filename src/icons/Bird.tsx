import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface Props {
  color?: string
  width?: number
  height?: number
  viewStyle?: ViewStyle
}

export default function Bird({ color = '#888FFE', width = 85, height = 83, viewStyle }: Props) {
  return (
    <View style={viewStyle}>
      <Svg testID="bird" width={width} height={height} fill="none">
        <Path
          fill={color}
          d="M18.66.202C16.125 67.928 48.287 65.87 48.287 65.87 35.873 34.96.305 46.298.305 46.298s33.04 22.55 35.037 19.572C37.34 62.892 13.724 47.453.305 79.59c17.734-9.495 26.64 14.14 84.154-3.029 0 0-29.106-8.122-65.798-76.358Z"
        />
      </Svg>
    </View>
  )
}
