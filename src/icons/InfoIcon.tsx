import * as React from 'react'
import { PixelRatio } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  size?: number
  color?: colors
  scaledSize?: number
  testID?: string
}

const getSizing = (baseSize: number = 16, maxSize: number = 28) => {
  return baseSize * PixelRatio.getFontScale() < maxSize
    ? baseSize * PixelRatio.getFontScale()
    : maxSize
}

function InfoIcon({
  size = 16,
  scaledSize = getSizing(size),
  color = colors.black,
  testID,
}: Props) {
  return (
    <Svg width={scaledSize} height={scaledSize} viewBox="0 0 16 16" fill="none" testID={testID}>
      <Circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.25" />
      <Path d="M8 12V7M8 6V5" stroke={color} strokeWidth="1.25" />
    </Svg>
  )
}

export default React.memo(InfoIcon)
