import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import Svg, { Path } from 'svgs'

interface Props {
  color?: colors
  style?: ViewStyle
}

function ProgressArrowIcon({ color = colors.dark, style }: Props) {
  return (
    <View style={style}>
      <Svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <Path
          d="M1.5 1L6.5 6L1.5 11"
          stroke={color}
          strokeWidth="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </Svg>
    </View>
  )
}

export default React.memo(ProgressArrowIcon)
