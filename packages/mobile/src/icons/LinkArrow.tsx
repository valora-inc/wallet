import * as React from 'react'
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native'

interface Props {
  style?: StyleProp<ImageStyle>
}

const LinkArrow = ({ style }: Props) => {
  return <Image source={require('src/images/link-arrow.png')} style={[styles.default, style]} />
}

const styles = StyleSheet.create({
  default: {
    height: 32,
    width: 32,
  },
})

export default React.memo(LinkArrow)
