import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

export interface Props {
  color?: string
  testID?: string
  size?: number
}

function DownIndicator({ color = colors.error, testID, size = 10 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none" testID={testID}>
      <Path
        fill={color}
        d="M4.369 0H5.63v7.576l3.473-3.472L10 5l-5 5-5-5 .896-.896L4.37 7.576V0Z"
      />
    </Svg>
  )
}

export default React.memo(DownIndicator)
