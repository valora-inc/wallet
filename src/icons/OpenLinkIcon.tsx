import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: colors
  size?: number
}

const OpenLinkIcon = ({ color = colors.white, size = 12 }: Props) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 12 12">
    <Path
      d="M10.148 10.148H1.852V1.852H6V.667H1.852C1.194.667.667 1.2.667 1.852v8.296c0 .652.527 1.185 1.185 1.185h8.296c.652 0 1.185-.533 1.185-1.185V6h-1.185v4.148ZM7.185.667v1.185h2.127L3.487 7.677l.836.836 5.825-5.826v2.128h1.185V.667H7.185Z"
      fill={color}
    />
  </Svg>
)
export default OpenLinkIcon
