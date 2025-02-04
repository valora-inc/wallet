import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import Svg, { Circle, Path } from 'svgs'
import { getSizing } from '../styles/accessibility'

interface Props {
  color: string
  width?: number
  style?: ViewStyle
}

export default class Error extends React.PureComponent<Props> {
  render() {
    const { width = getSizing(), style = {}, color = colors.contentPrimary } = this.props
    return (
      <View style={style}>
        <Svg testID="ErrorIcon" width={width} height={width} viewBox="0 0 16 16" fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.1569 4.75L11.2175 5.81066L8.97834 8.04984L11.3354 10.4069L10.2747 11.4675L7.91768 9.1105L5.56066 11.4675L4.5 10.4069L6.85702 8.04984L4.61785 5.81067L5.67851 4.75001L7.91768 6.98918L10.1569 4.75Z"
            fill={color}
          />
          <Circle cx="8" cy="8" r="6.5" stroke="white" />
        </Svg>
      </View>
    )
  }
}
