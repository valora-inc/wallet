import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

export interface Props {
  color?: string
  testID?: string
}

function UpIndicator({ color = colors.primary, testID }: Props) {
  return (
    <Svg width="10" height="10" viewBox="0 0 10 10" fill="none" testID={testID}>
      <Path d="M5.631 10H4.37V2.424L.896 5.896 0 5l5-5 5 5-.896.896L5.63 2.424V10Z" fill={color} />
    </Svg>
  )
}

export default React.memo(UpIndicator)
