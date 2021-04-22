import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function DeniedIcon({ color = colors.warning }: Props) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Circle cx="8" cy="8" r="7.25" stroke={color} stroke-width="1.5" />
      <Path
        d="M11 5L5.00002 11"
        stroke={color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M11 11L5.00002 5.00002"
        stroke={color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Svg>
  )
}

export default React.memo(DeniedIcon)
