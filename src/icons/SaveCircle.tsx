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

const SaveCircle = ({
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
      d="M13 28c-.55 0-1.021-.196-1.413-.588A1.922 1.922 0 0 1 11 26v-3h2v3h14v-3h2v3c0 .55-.196 1.021-.588 1.413A1.922 1.922 0 0 1 27 28H13Z"
    />
    <Path fill={color} d="m15 19 5 5 5-5-1.4-1.45-2.6 2.6V10h-2v10.15l-2.6-2.6L15 19Z" />
  </Svg>
)

export default React.memo(SaveCircle)
