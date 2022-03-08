import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

export interface Props {
  color?: string
}

function DownIndicator({ color = colors.warning }: Props) {
  return (
    <Svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <Path
        d="M0.257275 0.580077L4.74712 5.78633C4.87563 5.93535 5.1231 5.93535 5.25298 5.78633L9.74282 0.580077C9.90962 0.385937 9.75923 0.101562 9.48989 0.101562L0.510204 0.101562C0.240868 0.101562 0.090477 0.385937 0.257275 0.580077Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(DownIndicator)
