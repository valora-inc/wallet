import * as React from 'react'
import { ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  style?: ViewStyle
}

export default function SvgVectorsmartphone({ style }: Props) {
  return (
    <Svg width={12} height={20} fill="none" style={style}>
      <Path
        d="M4.75 16.665h2.5a.4.4 0 0 0 .292-.125.4.4 0 0 0 0-.583.4.4 0 0 0-.292-.125h-2.5a.4.4 0 0 0-.292.125.4.4 0 0 0 0 .583.4.4 0 0 0 .292.125Zm-2.917 2.5c-.458 0-.85-.163-1.177-.49a1.602 1.602 0 0 1-.49-1.176v-15c0-.459.164-.851.49-1.178.327-.326.72-.49 1.177-.489h8.334c.458 0 .85.163 1.177.49.327.327.49.719.49 1.177v15c0 .458-.164.85-.49 1.177-.327.327-.72.49-1.177.49H1.833Zm0-5.833h8.334V4.999H1.833v8.333Zm0 1.667v2.5h8.334v-2.5H1.833Zm0-11.667h8.334v-.833H1.833v.833Z"
        fill={Colors.black}
      />
    </Svg>
  )
}
