import * as React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'

interface Props {
  backgroundColor?: string
  radius?: number
  style?: StyleProp<ViewStyle>
}

export default class CheckmarkCircle extends React.PureComponent<Props> {
  static defaultProps = {
    backgroundColor: colors.greenUI,
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
          this.props.style,
        ]}
      >
        {this.props.children}
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
