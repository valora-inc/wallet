import * as React from 'react'
import { Image } from 'react-native'
import { copyIcon } from 'src/images/Images'

interface Props {
  height?: number
  width?: number
}

export default class CopyIcon extends React.PureComponent<Props> {
  static defaultProps = {
    height: 24,
    width: 24,
  }

  render() {
    return (
      <Image source={copyIcon} style={{ height: this.props.height, width: this.props.width }} />
    )
  }
}
