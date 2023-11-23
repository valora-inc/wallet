import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import Logo from 'src/icons/Logo'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'

const DAPP_IMAGE_SIZE = 40

interface Props {
  dappImageUrl?: string
  dappName: string
}

export default function Logos({ dappImageUrl, dappName }: Props) {
  const dappConnectInfo = useSelector(dappConnectInfoSelector)
  if (!dappImageUrl && dappConnectInfo !== DappConnectInfo.Basic) {
    return null
  }

  return (
    <View style={styles.logoContainer}>
      <View style={styles.logoShadow}>
        <View style={styles.logoBackground}>
          <Logo height={24} />
        </View>
      </View>
      <View style={styles.logoShadow}>
        {dappImageUrl ? (
          <Image style={styles.dappImage} source={{ uri: dappImageUrl }} resizeMode="cover" />
        ) : (
          <View style={[styles.logoBackground, styles.placeholderLogoBackground]}>
            <Text allowFontScaling={false} style={styles.placeholderLogoText}>
              {dappName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
  },
  logoShadow: {
    ...getShadowStyle(Shadow.SoftLight),
    borderRadius: 100,
  },
  logoBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    backgroundColor: Colors.white,
  },
  dappImage: {
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    backgroundColor: Colors.white,
    marginLeft: -4,
  },
  placeholderLogoBackground: {
    backgroundColor: Colors.white,
    marginRight: -Spacing.Small12,
    borderColor: Colors.gray2,
    borderWidth: 1,
  },
  placeholderLogoText: {
    ...fontStyles.h1,
    lineHeight: undefined,
    color: Colors.gray4,
  },
})
