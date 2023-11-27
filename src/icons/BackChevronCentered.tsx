import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { Colors } from 'src/styles/colors'

interface Props {
  color?: string
}

const BackChevronCentered = ({ color = Colors.black }: Props) => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path
      d="M19.4303 9.4303L17.9919 8L10 16L18 24L19.4303 22.5697L12.8606 16L19.4303 9.4303Z"
      fill={color}
    />
  </Svg>
)

export default BackChevronCentered
