import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  color?: string
}

export default function DownArrowIcon({ color = colors.gray3 }: Props) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M3 6l5 5 5-5" stroke={color} />
    </Svg>
  )
}
