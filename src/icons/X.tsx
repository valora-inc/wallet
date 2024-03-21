import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors, { Colors } from 'src/styles/colors'

interface Props {
  size?: number
  color?: colors
}

const X = ({ size = 24, color = Colors.black }: Props) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <Path
      d="M18.2929 6.41L13.0564 11.6464L12.7029 12L13.0564 12.3536L18.2929 17.59L17.59 18.2929L12.3536 13.0564L12 12.7029L11.6464 13.0564L6.41 18.2929L5.70711 17.59L10.9436 12.3536L11.2971 12L10.9436 11.6464L5.70711 6.41L6.41 5.70711L11.6464 10.9436L12 11.2971L12.3536 10.9436L17.59 5.70711L18.2929 6.41Z"
      fill={color}
      stroke={color}
    />
  </Svg>
)
export default X
