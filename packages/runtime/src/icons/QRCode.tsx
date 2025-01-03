import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const QRCode = ({ color = Colors.black }: { color?: Colors }) => (
  <Svg width={18} height={18}>
    <Path
      fill={color}
      d="M0 8h2v2H0V8Zm8-6h2v4H8V2ZM6 8h4v4H8v-2H6V8Zm6 0h2v2h2V8h2v2h-2v2h2v4h-2v2h-2v-2h-4v2H8v-4h4v-2h2v-2h-2V8Zm4 8v-4h-2v4h2ZM12 0h6v6h-6V0Zm2 2v2h2V2h-2ZM0 0h6v6H0V0Zm2 2v2h2V2H2ZM0 12h6v6H0v-6Zm2 2v2h2v-2H2Z"
    />
  </Svg>
)

export default QRCode
