import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const CopyIcon = ({ color = Colors.accent }) => (
  <Svg width={16} height={18} fill="none">
    <Path
      d="M11.655 0H1.835C.936 0 .2.736.2 1.636v11.455h1.636V1.636h9.819V0Zm2.454 3.273h-9c-.9 0-1.636.736-1.636 1.636v11.455c0 .9.736 1.636 1.636 1.636h9c.9 0 1.636-.736 1.636-1.636V4.909c0-.9-.736-1.636-1.636-1.636Zm0 13.09h-9V4.91h9v11.455Z"
      fill={color}
    />
  </Svg>
)

export default CopyIcon
