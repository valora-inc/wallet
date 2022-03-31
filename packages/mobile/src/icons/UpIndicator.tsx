import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

export interface Props {
  color?: string
  testID?: string
}

function UpIndicator({ color = colors.greenUI, testID }: Props) {
  return (
    <Svg width="10" height="6" viewBox="0 0 10 6" fill="none" testID={testID}>
      <Path
        d="M9.74273 5.41992L5.25288 0.213673C5.12437 0.06465 4.8769 0.06465 4.74702 0.213673L0.257178 5.41992C0.0903815 5.61406 0.240772 5.89844 0.510108 5.89844H9.4898C9.75913 5.89844 9.90952 5.61406 9.74273 5.41992Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(UpIndicator)
