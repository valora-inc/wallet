import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

export interface Props {
  color?: string
}

function UpHandle({ color = colors.onboardingBlue }) {
  return (
    <Svg width={14} height={6} viewBox="0 0 14 6" fill="none">
      <Path d="M1 5l6-4 6 4" stroke={color} />
    </Svg>
  )
}

export default React.memo(UpHandle)
