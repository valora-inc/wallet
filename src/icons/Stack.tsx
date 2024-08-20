import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  size?: number
  color?: string
}

function Stack({ color = colors.black, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M12 14 1 8l11-6 11 6-11 6Zm0 4L1.575 12.325l2.1-1.15L12 15.725l8.325-4.55 2.1 1.15L12 18Zm0 4L1.575 16.325l2.1-1.15L12 19.725l8.325-4.55 2.1 1.15L12 22Zm0-10.275L18.825 8 12 4.275 5.175 8 12 11.725Z"
      />
    </Svg>
  )
}

export default Stack
