import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  width?: number
  color?: string
  stroke?: boolean
  testID?: string
}

export default class Checkmark extends React.PureComponent<Props> {
  render() {
    const { height = 32, width = 32, color = colors.accent, stroke = false, testID } = this.props
    return (
      <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" testID={testID}>
        <Path
          d="M20.5 7.33 9.186 18.643 4 13.458l1.33-1.33 3.856 3.847L19.17 6 20.5 7.33Z"
          fill={color}
          stroke={stroke ? color : undefined}
        />
      </Svg>
    )
  }
}
