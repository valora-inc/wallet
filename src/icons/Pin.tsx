import * as React from 'react'
import { PixelRatio } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

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

function Pin({ size = 16, scaledSize = getSizing(size), color = colors.dark }: Props) {
  return (
    <Svg width={scaledSize} height={scaledSize} viewBox="0 0 28 34" fill="none">
      <Path
        d="M13.0584 32.5202L13.0574 32.5194C8.99189 28.9444 5.95037 25.6104 3.92662 22.5179C1.90253 19.425 0.905184 16.5869 0.905184 13.9987C0.905184 5.83789 7.12417 0.570833 13.9997 0.570833C20.8752 0.570833 27.0942 5.83789 27.0942 13.9987C27.0942 16.5869 26.0969 19.425 24.0748 22.518C22.0531 25.6105 19.0157 28.9445 14.9585 32.5195L14.9577 32.5202C14.4482 32.9731 13.5679 32.9731 13.0584 32.5202Z"
        fill="#45ADA8"
        stroke="white"
        stroke-width="0.477604"
      />
    </Svg>
  )
}

export default React.memo(Pin)
