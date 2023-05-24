import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { Colors } from 'src/styles/colors'

interface Props {
  color?: string
}

const TripleDotHorizontal = ({ color = Colors.onboardingGreen }: Props) => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path
      d="M10 14C8.9 14 8 14.9 8 16C8 17.1 8.9 18 10 18C11.1 18 12 17.1 12 16C12 14.9 11.1 14 10 14ZM22 14C20.9 14 20 14.9 20 16C20 17.1 20.9 18 22 18C23.1 18 24 17.1 24 16C24 14.9 23.1 14 22 14ZM16 14C14.9 14 14 14.9 14 16C14 17.1 14.9 18 16 18C17.1 18 18 17.1 18 16C18 14.9 17.1 14 16 14Z"
      fill={color}
    />
  </Svg>
)

export default TripleDotHorizontal
