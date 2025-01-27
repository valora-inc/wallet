import * as React from 'react'
import colors from 'src/styles/colors'
import { Circle, Svg } from 'svgs'

interface Props {
  height?: number
  color?: string
  selected?: boolean
  disabled?: boolean
}

export default class RadioButton extends React.PureComponent<Props> {
  static defaultProps = {
    width: 20,
    height: 20,
    color: colors.accent,
    selected: true,
    disabled: false,
  }

  render() {
    let stroke
    if (this.props.disabled) {
      stroke = colors.disabled
    } else if (this.props.selected) {
      stroke = this.props.color
    } else if (!this.props.selected) {
      stroke = colors.inactive
    }
    const fill = this.props.selected && !this.props.disabled ? this.props.color : 'none'
    return (
      <Svg height={this.props.height} width={this.props.height} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="10" r="9" stroke={stroke} strokeWidth={2} />
        <Circle cx="10" cy="10" r="6" fill={fill} />
      </Svg>
    )
  }
}
