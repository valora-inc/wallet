import * as React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import colors from 'src/styles/colors'

export interface Props {
  height?: number
  width?: number
  color?: string
  backgroundColor?: string
  rx?: number
}

const ShareCircle = ({
  backgroundColor = '#E8FCEF',
  color = colors.onboardingGreen,
  height = 40,
  width = 40,
  rx = 20,
}: Props) => (
  <Svg width={width} height={height} fill="none">
    <Rect width={width} height={height} fill={backgroundColor} rx={rx} />
    <Path
      fill={color}
      d="m23.5 12.5-1.242 1.242-1.392-1.39v9.773h-1.732v-9.774l-1.392 1.391L16.5 12.5 20 9l3.5 3.5Zm3.5 4.375V26.5c0 .962-.788 1.75-1.75 1.75h-10.5A1.75 1.75 0 0 1 13 26.5v-9.625c0-.971.779-1.75 1.75-1.75h2.625v1.75H14.75V26.5h10.5v-9.625h-2.625v-1.75h2.625c.962 0 1.75.779 1.75 1.75Z"
    />
  </Svg>
)

export default React.memo(ShareCircle)
