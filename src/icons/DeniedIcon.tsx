import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  size?: number
  color?: colors
}

function DeniedIcon({ color = colors.warning }: Props) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="7.25" stroke={color} strokeWidth="1.5" />
      <Path
        d="M11 5L5.00002 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 11L5.00002 5.00002"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default React.memo(DeniedIcon)
