import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: colors
}

const ArrowRightThick = ({ color = colors.gray3 }: Props) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M14 18L12.6 16.55L16.15 13H4V11H16.15L12.6 7.45L14 6L20 12L14 18Z" fill={color} />
  </Svg>
)

export default React.memo(ArrowRightThick)
