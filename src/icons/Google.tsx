import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const GoogleIcon = ({ color = Colors.black }) => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path
      fill={color}
      d="M23.456 15.28H16.12v2.184h5.208c-.264 3.048-2.8 4.352-5.2 4.352-3.064 0-5.752-2.416-5.752-5.816 0-3.28 2.56-5.816 5.76-5.816 2.472 0 3.92 1.576 3.92 1.576l1.52-1.584S19.624 8 16.056 8C11.512 8 8 11.84 8 16c0 4.04 3.304 8 8.176 8 4.28 0 7.4-2.936 7.4-7.272 0-.92-.12-1.448-.12-1.448Z"
    />
  </Svg>
)

export default GoogleIcon
