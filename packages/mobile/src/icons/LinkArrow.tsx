import * as React from 'react'
import { Image } from 'react-native'

const LinkArrow = ({ style = { width: 32, height: 32 } }) => {
  return <Image source={require('src/images/link-arrow.png')} style={style} />
}

export default React.memo(LinkArrow)
