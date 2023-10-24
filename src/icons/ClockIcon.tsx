import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  width?: number
  color?: string
}

export default class ClockIcon extends React.PureComponent<Props> {
  static defaultProps = {
    height: 32,
    width: 32,
    color: colors.greenBrand,
  }

  render() {
    return (
      <Svg width={this.props.width} height={this.props.height} viewBox="0 0 16 16" fill="none">
        <Path
          d="M9.36 10.427 7.467 8.533V5.867h1.066v2.226l1.574 1.574-.747.76ZM7.467 4.8V3.733h1.066V4.8H7.467ZM11.2 8.533V7.467h1.067v1.066H11.2Zm-3.733 3.734V11.2h1.066v1.067H7.467ZM3.733 8.533V7.467H4.8v1.066H3.733ZM8 13.333a5.19 5.19 0 0 1-2.08-.42 5.392 5.392 0 0 1-1.693-1.14 5.382 5.382 0 0 1-1.14-1.693A5.203 5.203 0 0 1 2.667 8c0-.738.14-1.431.42-2.08.28-.649.66-1.213 1.14-1.693.48-.48 1.044-.86 1.693-1.14A5.203 5.203 0 0 1 8 2.667c.738 0 1.431.14 2.08.42.649.28 1.213.66 1.693 1.14.48.48.86 1.044 1.14 1.693.28.649.42 1.342.42 2.08a5.19 5.19 0 0 1-.42 2.08 5.395 5.395 0 0 1-1.14 1.693 5.39 5.39 0 0 1-1.693 1.14c-.649.28-1.342.42-2.08.42Zm0-1.066c1.191 0 2.2-.414 3.027-1.24.826-.827 1.24-1.836 1.24-3.027s-.414-2.2-1.24-3.027C10.2 4.147 9.19 3.733 8 3.733s-2.2.414-3.027 1.24C4.147 5.8 3.733 6.81 3.733 8s.414 2.2 1.24 3.027c.827.826 1.836 1.24 3.027 1.24Z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
