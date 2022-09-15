import * as React from 'react'
import { Image } from 'react-native'
import { coinbasePayIcon } from 'src/images/Images'

interface Props {
  size?: number
}

export default class CoinbasePayIcon extends React.PureComponent<Props> {
  static defaultProps = {
    size: 40,
  }

  render() {
    return (
      <Image
        resizeMode="contain"
        source={coinbasePayIcon}
        style={{ width: this.props.size, height: this.props.size }}
      />
    )
  }
}
