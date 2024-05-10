import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import Svg, { Rect } from 'svgs'

interface Props {
  size?: number
  style?: ViewStyle
  testID?: string
}

export default function PointsCoverImage({ size = 180, testID, style }: Props) {
  return (
    <View testID={testID} style={style}>
      <Svg width={size} height={size} viewBox="0 0 180 180" fill="none">
        <Rect width="180" height="180" fill="#FF00FF" />
      </Svg>
    </View>
  )
}
