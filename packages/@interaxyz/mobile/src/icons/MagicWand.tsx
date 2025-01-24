import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const MagicWand = ({ size = 24, color = Colors.successDark }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="m8.573 6.085-2.143 1.2 1.2-2.142L6.43 3l2.143 1.2L10.716 3l-1.2 2.143 1.2 2.142-2.143-1.2Zm10.284 8.4 2.143-1.2-1.2 2.142L21 17.57l-2.143-1.2-2.142 1.2 1.2-2.143-1.2-2.143 2.142 1.2ZM21 3l-1.2 2.143L21 7.285l-2.143-1.2-2.142 1.2 1.2-2.142L16.715 3l2.142 1.2L21 3Zm-7.422 9.239 2.091-2.091-1.817-1.817-2.09 2.091 1.816 1.817Zm.883-4.705 2.005 2.005c.334.317.334.874 0 1.209L6.465 20.749c-.335.335-.892.335-1.209 0l-2.005-2.005c-.335-.317-.335-.874 0-1.209L13.252 7.534c.335-.335.892-.335 1.209 0Z"
    />
  </Svg>
)

export default MagicWand
