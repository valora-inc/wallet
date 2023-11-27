import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: colors
  size?: number
}

const ScanIcon = ({ color = colors.black, size = 20 }: Props) => (
  <Svg width={size} height={size} fill="none">
    <Path
      d="M15 20V18H18V15H20V18.5C20 18.9 19.8 19.2 19.5 19.5C19.2 19.8 18.8 20 18.5 20H15ZM5 20H1.5C1.1 20 0.8 19.8 0.5 19.5C0.2 19.2 0 18.8 0 18.5V15H2V18H5V20ZM15 0H18.5C18.9 0 19.2 0.2 19.5 0.5C19.8 0.8 20 1.1 20 1.5V5H18V2H15V0ZM5 0V2H2V5H0V1.5C0 1.1 0.2 0.8 0.5 0.5C0.8 0.2 1.1 0 1.5 0H5ZM17 9H3V11H17V9Z"
      fill={color}
    />
  </Svg>
)

export default ScanIcon
