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
      d="M15.722 17.567v.5h2.624l-3.235 3.227-3.235-3.227H14.5v-7.79h1.222v7.29ZM7.833 6.433v-.5H5.21l3.235-3.227 3.236 3.227H9.056v7.79H7.833v-7.29Z"
    />
  </Svg>
)
export default SwapArrows
