import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { PixelRatio } from 'react-native'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
  scaledSize?: number
}

const getSizing = (baseSize: number = 16, maxSize: number = 28) => {
  return baseSize * PixelRatio.getFontScale() < maxSize
    ? baseSize * PixelRatio.getFontScale()
    : maxSize
}

function InfoIcon({ size = 16, scaledSize = getSizing(size), color = colors.dark }: Props) {
  return (
    <Svg
      width={scaledSize}
      height={scaledSize}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Circle cx="8" cy="8" r="7" stroke={color} stroke-width="1.25" />
      <Path d="M8 12V7M8 6V5" stroke={color} stroke-width="1.25" />
    </Svg>
  )
}

export default React.memo(InfoIcon)
