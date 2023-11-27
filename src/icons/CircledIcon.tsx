import * as React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'

interface Props {
  backgroundColor?: string
  radius?: number
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export default class CircledIcon extends React.PureComponent<Props> {
  static defaultProps = {
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
          styles.container,
          this.props.style,
        ]}
      >
        {this.props.children}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
