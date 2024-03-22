import React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useSelector } from 'src/redux/hooks'
import { networksIconSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'

interface Props {
  networkId: NetworkId
  children: React.ReactNode
}

export default function IconWithNetworkBadge({ networkId, children }: Props) {
  const networkIcons = useSelector((state) => networksIconSelector(state, [networkId]))
  const networkImageUrl = networkIcons[networkId]
  return (
    <View>
      {children}
      {networkImageUrl && (
        <FastImage
          source={{
            uri: networkImageUrl,
          }}
          style={styles.networkIconStyle}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  networkIconStyle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 25,
    left: 25,
  },
})
