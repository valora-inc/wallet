import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Checkmark from 'src/icons/Checkmark'
import colors from 'src/styles/colors'

interface Props {
  checkHeight?: number
  checkWidth?: number
  checkColor?: string
  backgroundColor?: string
  radius?: number
}

export default class CheckmarkCircle extends React.PureComponent<Props> {
  static defaultProps = {
    checkHeight: 22,
    checkWidth: 22,
    checkColor: colors.white,
    backgroundColor: colors.primary,
    radius: 50,
  }

  render() {
    return (
      <View
        style={[
          {
            backgroundColor: this.props.backgroundColor,
            height: this.props.radius,
            width: this.props.radius,
            borderRadius: this.props.radius,
          },
          styles.checkmarkContainer,
        ]}
      >
        <Checkmark
          color={this.props.checkColor}
          width={this.props.checkWidth}
          height={this.props.checkHeight}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
