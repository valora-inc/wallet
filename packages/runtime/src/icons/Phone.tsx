import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color?: Colors
  size?: number
  testID?: string
}

export default function Phone({ color = Colors.black, size = 24, testID }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" testID={testID}>
      <Path
        fill={color}
        d="M10.5 20h3a.48.48 0 0 0 .35-.15.48.48 0 0 0 0-.7.48.48 0 0 0-.35-.15h-3a.48.48 0 0 0-.35.15.48.48 0 0 0 0 .7c.1.1.217.15.35.15ZM7 23c-.55 0-1.021-.196-1.413-.588A1.922 1.922 0 0 1 5 21V3c0-.55.196-1.021.588-1.413A1.922 1.922 0 0 1 7 1h10c.55 0 1.021.196 1.413.588.392.392.588.863.587 1.412v18c0 .55-.196 1.021-.588 1.413A1.922 1.922 0 0 1 17 23H7Zm0-7h10V6H7v10Zm0 2v3h10v-3H7ZM7 4h10V3H7v1Z"
      />
    </Svg>
  )
}
