import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  color?: colors
  style?: ViewStyle
  height?: number
  width?: number
}

function ProgressArrowIcon({ color = colors.dark, style, height = 12, width = 8 }: Props) {
  return (
    <View style={style}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 8 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Path
          d="M1.5 1L6.5 6L1.5 11"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

export default React.memo(ProgressArrowIcon)
