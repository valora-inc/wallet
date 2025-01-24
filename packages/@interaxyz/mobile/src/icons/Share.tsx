import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

export interface Props {
  size?: number
  color?: string
}

function Share({ color = colors.accent, size = 32 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="m16 5-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4Zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 0 1 2 2Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(Share)
