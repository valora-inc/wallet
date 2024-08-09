import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

interface Props {
  foregroundColor: string
  backgroundColor: string
}

export default function DefaultAvatar({ foregroundColor, backgroundColor }: Props) {
  return (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Circle cx="20" cy="20" r="20" fill={backgroundColor} />
      <Path
        d="M20 12a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 7c2.67 0 8 1.33 8 4v3H12v-3c0-2.67 5.33-4 8-4Zm0 1.9c-2.97 0-6.1 1.46-6.1 2.1v1.1h12.2V25c0-.64-3.13-2.1-6.1-2.1Z"
        fill={foregroundColor}
      />
    </Svg>
  )
}
