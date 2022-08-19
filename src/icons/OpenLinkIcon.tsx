import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'react-native-svg'

interface Props {
  color?: colors
}

const OpenLinkIcon = ({ color = colors.white }: Props) => (
  <Svg width={24} height={24} fill={color}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.75 8.25a4.5 4.5 0 0 1 4.5-4.5h7.5a4.5 4.5 0 0 1 4.5 4.5v7.5a4.5 4.5 0 0 1-4.5 4.5h-7.5a4.5 4.5 0 0 1-4.5-4.5v-7.5Zm4.5-3a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3h7.5a3 3 0 0 0 3-3v-7.5a3 3 0 0 0-3-3h-7.5Zm1.886 3.621a.75.75 0 0 1 .75-.75h4.242a.75.75 0 0 1 .75.75v4.243a.75.75 0 0 1-1.5 0v-2.432l-5.614 5.614a.75.75 0 0 1-1.06-1.06l5.614-5.615h-2.432a.75.75 0 0 1-.75-.75Z"
      fill={color}
    />
  </Svg>
)

export default OpenLinkIcon
