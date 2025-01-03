import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const AppleIcon = ({ color = Colors.black }) => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path
      fill={color}
      d="M22.442 24.531c-1.12 1.055-2.343.889-3.52.389-1.246-.511-2.388-.534-3.703 0-1.645.689-2.514.489-3.497-.389-5.577-5.588-4.754-14.098 1.577-14.41 1.543.078 2.617.823 3.52.89 1.349-.267 2.64-1.034 4.08-.934 1.726.133 3.029.8 3.886 2-3.566 2.078-2.72 6.644.548 7.921-.651 1.667-1.497 3.322-2.902 4.544l.011-.011Zm-5.737-14.476c-.171-2.477 1.897-4.522 4.274-4.722.332 2.867-2.674 5-4.274 4.722Z"
    />
  </Svg>
)

export default AppleIcon
