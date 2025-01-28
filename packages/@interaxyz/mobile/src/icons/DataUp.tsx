import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors, { ColorValue } from 'src/styles/colors'

interface Props {
  color?: ColorValue
  testID?: string
}

const DataUp = ({ color = colors.accent, testID }: Props) => (
  <Svg width={10} height={6} viewBox="0 0 10 6" fill="none" testID={testID}>
    <Path d="M5 0L0 6H10L5 0Z" fill={color} />
  </Svg>
)

export default React.memo(DataUp)
