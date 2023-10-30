import * as React from 'react'
import { Path, Svg } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  size?: number
  color?: Colors
}

const Alert = ({ size = 16, color = Colors.errorDark }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.1 14.7h1.8v1.8h-1.8v-1.8Zm0-7.2h1.8v5.4h-1.8V7.5ZM12 3c-4.977 0-9 4.05-9 9a9 9 0 1 0 9-9Zm0 16.2a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(Alert)
