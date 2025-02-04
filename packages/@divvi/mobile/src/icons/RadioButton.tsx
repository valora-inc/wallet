import * as React from 'react'
import colors from 'src/styles/colors'
import { Circle, Svg } from 'svgs'

interface Props {
  width?: number
  height?: number
  color?: string
  selected?: boolean
  disabled?: boolean
}

export default class RadioButton extends React.PureComponent<Props> {
  render() {
    const {
      width = 20,
      height = 20,
      color = colors.accent,
      selected = true,
      disabled = false,
    } = this.props

    let stroke
    if (disabled) {
      stroke = colors.disabled
    } else if (selected) {
      stroke = color
    } else if (!selected) {
      stroke = colors.inactive
    }
    const fill = selected && !disabled ? color : 'none'
    return (
      <Svg height={height} width={width} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="10" r="9" stroke={stroke} strokeWidth={2} />
        <Circle cx="10" cy="10" r="6" fill={fill} />
      </Svg>
    )
  }
}
