import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: colors
}

const DataUp = ({ color = colors.primary }: Props) => (
  <Svg width={10} height={6} viewBox="0 0 10 6" fill="none">
    <Path d="M5 0L0 6H10L5 0Z" fill={color} />
  </Svg>
)

export default React.memo(DataUp)
