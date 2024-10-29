import * as React from 'react'
import Svg, { Circle } from 'react-native-svg'
import User from 'src/icons/User'
import Colors from 'src/styles/colors'

interface Props {
  foregroundColor: Colors
  backgroundColor: Colors
}

export default function DefaultAvatar({
  foregroundColor = Colors.white,
  backgroundColor = Colors.accent,
}: Props) {
  return (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Circle cx="20" cy="20" r="20" fill={backgroundColor} />
      <Svg color={foregroundColor} viewBox="-8 -8 40 40">
        <User />
      </Svg>
    </Svg>
  )
}
