import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function DeniedIcon({ color = colors.warning }: Props) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Path
        d="M8 3V8H12"
        stroke="#FFA500"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="8" r="7.25" stroke="#FFA500" strokeWidth="1.5" />
    </Svg>
  )
}

export default React.memo(DeniedIcon)
