import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import DefaultToken from 'src/icons/DefaultToken'
import { BaseToken } from 'src/tokens/slice'

export enum IconSize {
  SMALL = 'small',
  MEDIUM = 'medium',
}

const IconSizeToStyle = {
  [IconSize.SMALL]: {
    tokenImageSize: 20,
    networkImageSize: 8,
    networkImagePosition: 13,
  },
  [IconSize.MEDIUM]: {
    tokenImageSize: 32,
    networkImageSize: 12,
    networkImagePosition: 20,
  },
}

interface Props {
  token: BaseToken
  viewStyle?: StyleProp<ViewStyle>
  testID?: string
  size?: IconSize
}

export default function TokenIcon({ token, viewStyle, testID, size = IconSize.MEDIUM }: Props) {
  const { tokenImageSize, networkImageSize, networkImagePosition } = IconSizeToStyle[size]

  return (
    <View testID={testID} style={viewStyle}>
      {token.imageUrl ? (
        <FastImage
          source={{
            uri: token.imageUrl,
          }}
          style={[
            styles.tokenImage,
            {
              width: tokenImageSize,
              height: tokenImageSize,
              borderRadius: tokenImageSize / 2,
            },
          ]}
          testID={testID ? `${testID}/TokenIcon` : 'TokenIcon'}
        />
      ) : (
        <DefaultToken
          testID={testID ? `${testID}/DefaultTokenIcon` : 'DefaultTokenIcon'}
          size={tokenImageSize}
        />
      )}

      {token.networkIconUrl && (
        <FastImage
          source={{ uri: token.networkIconUrl }}
          style={[
            styles.networkImage,
            {
              width: networkImageSize,
              height: networkImageSize,
              borderRadius: networkImageSize / 2,
              top: networkImagePosition,
              left: networkImagePosition,
            },
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
  networkImage: {
    position: 'absolute',
  },
})
