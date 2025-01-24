import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: colors | string
  size?: number
  testID?: string
}

export function ImageErrorIcon({
  color = colors.gray3,
  size = 88,
  testID = 'ImageErrorIcon',
}: Props) {
  return (
    <Svg testID={testID} width={size} height={size} fill="none" viewBox="0 0 40 40">
      <Path
        d="M35 33.05L6.95 5L5 6.95L6.5 8.45V30.5C6.5 32.15 7.85 33.5 9.5 33.5H31.55L33.05 35L35 33.05ZM9.5 30.5V11.45L20.9 22.85L18.65 25.7L15.5 21.65L11 27.5H25.55L28.55 30.5H9.5ZM15.2 9.5L12.2 6.5H30.5C32.15 6.5 33.5 7.85 33.5 9.5V27.8L30.5 24.8V9.5H15.2Z"
        fill={color}
      />
    </Svg>
  )
}

export default ImageErrorIcon
