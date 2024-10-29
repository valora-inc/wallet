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
    color: colors.accent,
  }

  render() {
    return (
      <Svg width={this.props.width} height={this.props.height} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14.04 15.64 11.2 12.8v-4h1.6v3.34l2.36 2.36-1.12 1.14ZM11.2 7.2V5.6h1.6v1.6h-1.6Zm5.6 5.6v-1.6h1.6v1.6h-1.6Zm-5.6 5.6v-1.6h1.6v1.6h-1.6Zm-5.6-5.6v-1.6h1.6v1.6H5.6ZM12 20a7.785 7.785 0 0 1-3.12-.63 8.091 8.091 0 0 1-2.54-1.71 8.074 8.074 0 0 1-1.71-2.54A7.804 7.804 0 0 1 4 12c0-1.107.21-2.147.63-3.12.42-.973.99-1.82 1.71-2.54a8.073 8.073 0 0 1 2.54-1.71A7.804 7.804 0 0 1 12 4c1.107 0 2.147.21 3.12.63.973.42 1.82.99 2.54 1.71s1.29 1.567 1.71 2.54c.42.973.63 2.013.63 3.12 0 1.107-.21 2.147-.63 3.12-.42.973-.99 1.82-1.71 2.54a8.085 8.085 0 0 1-2.54 1.71c-.973.42-2.013.63-3.12.63Zm0-1.6c1.787 0 3.3-.62 4.54-1.86 1.24-1.24 1.86-2.753 1.86-4.54s-.62-3.3-1.86-4.54C15.3 6.22 13.787 5.6 12 5.6s-3.3.62-4.54 1.86C6.22 8.7 5.6 10.213 5.6 12s.62 3.3 1.86 4.54C8.7 17.78 10.213 18.4 12 18.4Z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
