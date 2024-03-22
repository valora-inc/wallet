import * as React from 'react'
import Colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: string
}

const SwapArrows = ({ size = 24, color = Colors.black }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M11.722 15.567v.5h2.624l-3.235 3.227-3.235-3.227H10.5v-7.79h1.222v7.29ZM3.833 4.433v-.5H1.21L4.444.706 7.68 3.933H5.056v7.79H3.833v-7.29Z"
    />
  </Svg>
)
export default SwapArrows
