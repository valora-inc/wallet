import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color?: string
}

const TripleDotVertical = ({ color = Colors.gray3 }: Props) => (
  <Svg width={4} height={16} fill="none">
    <Path
      d="M.688 1.414a1.313 1.313 0 1 0 2.625 0 1.313 1.313 0 0 0-2.626 0Zm0 6.563a1.313 1.313 0 1 0 2.625 0 1.313 1.313 0 0 0-2.626 0Zm0 6.562a1.312 1.312 0 1 0 2.624 0 1.312 1.312 0 0 0-2.624 0Z"
      fill={color}
    />
  </Svg>
)

export default TripleDotVertical
