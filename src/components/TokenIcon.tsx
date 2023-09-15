import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import { BaseToken } from 'src/tokens/slice'
interface Props {
  token: BaseToken
  viewStyle?: StyleProp<ViewStyle>
  testID?: string
}

export default function TokenIcon({ token, viewStyle, testID }: Props) {
  return (
    <View testID={testID} style={viewStyle}>
      <FastImage
        source={{
          uri: token.imageUrl,
        }}
        style={styles.mainTokenImage}
        testID={testID ? `${testID}/TokenIcon` : 'TokenIcon'}
      />
      {token.networkIconUrl && (
        <FastImage
          source={{ uri: token.networkIconUrl }}
          style={styles.smallTokenImage}
          testID={testID ? `${testID}/NetworkIcon` : 'NetworkIcon'}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  mainTokenImage: {
    width: 32,
    height: 32,
    borderRadius: 20,
    position: 'relative',
    top: 0,
    left: 0,
  },
  smallTokenImage: {
    width: 12,
    height: 12,
    borderRadius: 8,
    position: 'absolute',
    top: 20,
    left: 20,
  },
})
