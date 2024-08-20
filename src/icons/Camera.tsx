import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: string
  size?: number
}

export default function Camera({ color = colors.black, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M20 4h-3.17L15 2H9L7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
      />
    </Svg>
  )
}
