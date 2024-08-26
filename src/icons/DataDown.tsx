import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: colors
  testID?: string
}

const DataDown = ({ color = colors.error, testID }: Props) => (
  <Svg width={10} height={6} viewBox="0 0 10 6" fill="none" testID={testID}>
    <Path d="M5 6L10 -9.53674e-07L4.29138e-07 -7.94466e-08L5 6Z" fill={color} />
  </Svg>
)

export default React.memo(DataDown)
