import * as React from 'react'
import { ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  style?: ViewStyle
}

export default function EnvelopeIcon({ style }: Props) {
  return (
    <Svg width={18} height={15} fill="none" style={style}>
      <Path
        d="M12.292 14.978a.93.93 0 0 1-.313-.052.721.721 0 0 1-.27-.177l-2.376-2.375a.79.79 0 0 1-.229-.584.79.79 0 0 1 .23-.583.79.79 0 0 1 .583-.23.79.79 0 0 1 .583.23l1.792 1.792 4.125-4.125a.79.79 0 0 1 .583-.23.79.79 0 0 1 .583.23.79.79 0 0 1 .23.583.79.79 0 0 1-.23.583l-4.708 4.709a.737.737 0 0 1-.27.177.904.904 0 0 1-.313.052ZM2.333 1.998 9 6.166 15.667 2H2.333Zm0 11.667c-.458 0-.85-.163-1.177-.49A1.602 1.602 0 0 1 .666 12v-10c0-.459.164-.851.49-1.178.327-.326.72-.49 1.177-.489h13.334c.458 0 .85.163 1.177.49.327.327.49.719.49 1.177v3.625l-.834.833-.833.833V3.665l-6.23 3.896A.877.877 0 0 1 9 7.686a.847.847 0 0 1-.437-.125l-6.23-3.896V12h4.292l1.667 1.666H2.333Z"
        fill={Colors.black}
      />
    </Svg>
  )
}
