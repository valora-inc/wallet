import React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useSelector } from 'src/redux/hooks'
import { networksIconSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'

export enum NetworkBadgeSize {
  Large = 'Large',
  Medium = 'Medium',
}

// More sizes for reference here:
//  https://github.com/valora-inc/wallet/blob/main/src/components/TokenIcon.tsx#L15
const NetworkBadgeSizeToStyle = {
  [NetworkBadgeSize.Medium]: {
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 20,
    left: 20,
  },
  [NetworkBadgeSize.Large]: {
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 25,
    left: 25,
  },
}

interface Props {
  networkId: NetworkId
  size?: NetworkBadgeSize
  testID?: string
  children: React.ReactNode
}

// TODO(ACT-1137): update TokenIcon to use this
export default function IconWithNetworkBadge({
  networkId,
  testID,
  children,
  size = NetworkBadgeSize.Large,
}: Props) {
  const networkIcons = useSelector(networksIconSelector)
  const networkImageUrl = networkIcons[networkId]
  const networkBadgeStyle = NetworkBadgeSizeToStyle[size]
  return (
    <View>
      {children}
      {!!networkImageUrl && (
        <FastImage
          source={{
            uri: networkImageUrl,
          }}
          style={{ ...styles.networkBadgeStyle, ...networkBadgeStyle }}
          testID={testID ? `${testID}/NetworkBadge` : 'NetworkBadge'}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  networkBadgeStyle: {
    position: 'absolute',
  },
})
