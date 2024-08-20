import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  size?: number
  color?: string
}

function Preferences({ color = colors.black, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M5 20v-7H3v-2h6v2H7v7H5ZM5 9V4h2v5H5Zm4 0V7h2V4h2v3h2v2H9Zm2 11v-9h2v9h-2Zm6 0v-3h-2v-2h6v2h-2v3h-2Zm0-7V4h2v9h-2Z"
      />
    </Svg>
  )
}

export default Preferences
