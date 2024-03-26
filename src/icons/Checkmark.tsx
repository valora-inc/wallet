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
  static defaultProps = {
    height: 32,
    width: 32,
    color: colors.primary,
    stroke: false,
    testID: undefined,
  }

  render() {
    return (
      <Svg
        width={this.props.width}
        height={this.props.height}
        viewBox="0 0 24 24"
        fill="none"
        testID={this.props.testID}
      >
        <Path
          d="M20.5 7.33 9.186 18.643 4 13.458l1.33-1.33 3.856 3.847L19.17 6 20.5 7.33Z"
          fill={this.props.color}
          stroke={this.props.stroke ? this.props.color : undefined}
        />
      </Svg>
    )
  }
}
