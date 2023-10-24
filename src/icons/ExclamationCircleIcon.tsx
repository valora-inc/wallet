import * as React from 'react'
import { Path, Svg } from 'react-native-svg'
import Colors from 'src/styles/colors'
interface Props {
  size?: number
  color?: Colors | string
}

const ExclamationCircleIcon = ({ size = 20, color = Colors.greenUI }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M7.4 9.8h1.2V11H7.4V9.8Zm0-4.8h1.2v3.6H7.4V5ZM8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm0 10.8a4.8 4.8 0 1 1 0-9.6 4.8 4.8 0 0 1 0 9.6Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(ExclamationCircleIcon)
