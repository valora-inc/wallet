import React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { IconSize, IconSizeToStyle } from 'src/components/TokenIcon'
import { useSelector } from 'src/redux/hooks'
import { networksIconSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'

interface Props {
  networkId: NetworkId
  children: React.ReactNode
  size?: IconSize
  displayNetworkIcon?: boolean
}

// TODO(ACT-1137): update TokenIcon to use this
export default function IconWithNetworkBadge({
  networkId,
  children,
  size = IconSize.LARGE,
  displayNetworkIcon = true,
}: Props) {
  const networkIcons = useSelector(networksIconSelector)
  const networkImageUrl = networkIcons[networkId]
  const { networkImageSize, networkImagePosition } = IconSizeToStyle[size]

  return (
    <View>
      {children}
      {networkImageUrl && displayNetworkIcon && (
        <FastImage
          source={{
            uri: networkImageUrl,
          }}
          style={[
            styles.networkIconStyle,
            {
              width: networkImageSize,
              height: networkImageSize,
              borderRadius: networkImageSize / 2,
              top: networkImagePosition,
              left: networkImagePosition,
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  networkIconStyle: {
    position: 'absolute',
  },
})
