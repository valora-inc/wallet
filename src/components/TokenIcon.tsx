import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import DefaultToken from 'src/icons/DefaultToken'
import { BaseToken } from 'src/tokens/slice'

export enum IconSize {
  SMALL = 'small',
  MEDIUM = 'medium',
}

interface Props {
  token: BaseToken
  viewStyle?: StyleProp<ViewStyle>
  testID?: string
  size?: IconSize
}

export default function TokenIcon({ token, viewStyle, testID, size = IconSize.MEDIUM }: Props) {
  return (
    <View testID={testID} style={viewStyle}>
      {token.imageUrl ? (
        <FastImage
          source={{
            uri: token.imageUrl,
          }}
          style={[
            styles.tokenImage,
            size === IconSize.MEDIUM ? styles.mediumTokenImage : styles.smallTokenImage,
          ]}
          testID={testID ? `${testID}/TokenIcon` : 'TokenIcon'}
        />
      ) : (
        <DefaultToken
          testID={testID ? `${testID}/DefaultTokenIcon` : 'DefaultTokenIcon'}
          size={size === IconSize.MEDIUM ? 32 : 20}
        />
      )}

      {token.networkIconUrl && (
        <FastImage
          source={{ uri: token.networkIconUrl }}
          style={[
            styles.networkImage,
            size === IconSize.MEDIUM ? styles.mediumNetworkImage : styles.smallNetworkImage,
          ]}
          testID={testID ? `${testID}/NetworkIcon` : 'NetworkIcon'}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tokenImage: {
    position: 'relative',
    top: 0,
    left: 0,
  },
  mediumTokenImage: {
    width: 32,
    height: 32,
    borderRadius: 20,
  },
  smallTokenImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  networkImage: {
    position: 'absolute',
  },
  mediumNetworkImage: {
    width: 12,
    height: 12,
    borderRadius: 8,
    top: 20,
    left: 20,
  },
  smallNetworkImage: {
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 13,
    left: 13,
  },
})
