import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Times from 'src/icons/Times'
import colors from 'src/styles/colors'
import { iconHitslop } from 'src/styles/variables'

interface ButtonProps {
  onPress: () => void
  solid: boolean
  style?: any
  size?: number
  borderWidth?: number
  disabled?: boolean
  activeColor?: string
  inactiveColor?: string
}

export default class CircleButton extends React.PureComponent<ButtonProps> {
  static defaultProps = {
    size: 50,
    disable: false,
    activeColor: colors.accent,
    inactiveColor: `${colors.accent}80`,
  }

  render() {
    const { onPress, solid, borderWidth, disabled, size, activeColor, inactiveColor } = this.props
    const color = disabled ? inactiveColor : activeColor
    const buttonStyle = [
      styles.button,
      solid ? { backgroundColor: color } : { backgroundColor: 'transparent' },
      borderWidth !== undefined ? { borderWidth } : { borderWidth: 0 },
      { borderColor: color, width: size, height: size, borderRadius: Math.floor(size! / 2) },
    ]
    const xColor = solid ? colors.textInverse : color

    return (
      <View style={[styles.row, this.props.style]}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          style={buttonStyle}
          hitSlop={iconHitslop}
        >
          <Times height={Math.floor(size! * 0.4)} color={xColor} />
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
