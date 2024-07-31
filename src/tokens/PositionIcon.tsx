import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { Spacing } from 'src/styles/styles'
import { Position } from 'src/positions/types'
import IconWithNetworkBadge, { NetworkBadgeSize } from 'src/components/IconWithNetworkBadge'

export function PositionIcon({ position, testID }: { position: Position; testID?: string }) {
  return (
    <IconWithNetworkBadge networkId={position.networkId} size={NetworkBadgeSize.Medium}>
      <Image source={{ uri: position.displayProps.imageUrl }} style={styles.positionImg} />
    </IconWithNetworkBadge>
  )
}

const styles = StyleSheet.create({
  positionImg: {
    width: 32,
    height: 32,
    borderRadius: 20,
    marginRight: Spacing.Regular16,
  },
})
