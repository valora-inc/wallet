import * as React from 'react'
import { Path, Svg } from 'react-native-svg'
import Colors from 'src/styles/colors'
interface Props {
  size?: number
  color?: Colors | string
}

const ExclamationCircleIcon = ({ size = 20, color = Colors.greenUI }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M9 13h2v2H9v-2Zm0-8h2v6H9V5Zm.99-5C4.47 0 0 4.48 0 10s4.47 10 9.99 10C15.52 20 20 15.52 20 10S15.52 0 9.99 0ZM10 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(ExclamationCircleIcon)
