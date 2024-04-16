import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import IconWithNetworkBadge from 'src/components/IconWithNetworkBadge'
import colors from 'src/styles/colors'
import { BaseToken } from 'src/tokens/slice'

export enum IconSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
}

export const IconSizeToStyle = {
  [IconSize.SMALL]: {
    tokenImageSize: 24,
    networkImageSize: 9,
    networkImagePosition: 15,
    tokenTextSize: 6,
  },
  [IconSize.MEDIUM]: {
    tokenImageSize: 32,
    networkImageSize: 12,
    networkImagePosition: 20,
    tokenTextSize: 10,
  },
  [IconSize.LARGE]: {
    tokenImageSize: 40,
    networkImageSize: 16,
    networkImagePosition: 25,
    tokenTextSize: 12,
  },
  [IconSize.XLARGE]: {
    tokenImageSize: 48,
    networkImageSize: 20,
    networkImagePosition: 30,
    tokenTextSize: 14,
  },
}

interface Props {
  token: BaseToken
  viewStyle?: StyleProp<ViewStyle>
  testID?: string
  size?: IconSize
  displayNetworkIcon?: boolean
}

export default function TokenIcon({
  token,
  viewStyle,
  testID,
  size = IconSize.MEDIUM,
  displayNetworkIcon = true,
}: Props) {
  const { tokenImageSize, tokenTextSize } = IconSizeToStyle[size]

  return (
    <View testID={testID} style={viewStyle}>
      <IconWithNetworkBadge
        networkId={token.networkId}
        size={size}
        displayNetworkIcon={displayNetworkIcon}
      >
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
          <View
            style={[
              styles.tokenCircle,
              {
                width: tokenImageSize,
                height: tokenImageSize,
                borderRadius: tokenImageSize / 2,
              },
            ]}
            testID={testID ? `${testID}/DefaultTokenIcon` : 'DefaultTokenIcon'}
          >
            <Text style={[styles.tokenText, { fontSize: tokenTextSize }]} allowFontScaling={false}>
              {token.symbol.substring(0, 4)}
            </Text>
          </View>
        )}
      </IconWithNetworkBadge>
    </View>
  )
}

const styles = StyleSheet.create({
  tokenImage: {
    position: 'relative',
    top: 0,
    left: 0,
  },
  tokenCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray2,
  },
  tokenText: {
    color: colors.black,
    textAlign: 'center',
  },
})
