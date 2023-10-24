import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  width?: number
  color?: string
  testID?: string
}

export default class Checkmark extends React.PureComponent<Props> {
  static defaultProps = {
    height: 32,
    width: 32,
    color: colors.greenBrand,
    testID: undefined,
  }

  render() {
    return (
      <Svg
        width={this.props.width}
        height={this.props.height}
        viewBox="0 0 16 16"
        fill="none"
        testID={this.props.testID}
      >
        <Path
          d="M13.667 4.886 6.124 12.43 2.667 8.972l.886-.886 2.57 2.564L12.78 4l.887.886Z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
