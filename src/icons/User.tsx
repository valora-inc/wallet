import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: string
  size?: number
}

export default function User({ color = colors.black, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 7c2.67 0 8 1.33 8 4v3H4v-3c0-2.67 5.33-4 8-4Zm0 1.9c-2.97 0-6.1 1.46-6.1 2.1v1.1h12.2V17c0-.64-3.13-2.1-6.1-2.1Z"
      />
    </Svg>
  )
}
