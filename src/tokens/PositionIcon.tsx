import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useSelector } from 'src/redux/hooks'
import { networksIconSelector } from 'src/tokens/selectors'
import { Spacing } from 'src/styles/styles'
import { Position } from 'src/positions/types'

const networkImageSize = 12
const networkImagePosition = 20

export const PositionIcon = ({ position, testID }: { position: Position; testID?: string }) => {
  const networkIconByNetworkId = useSelector(networksIconSelector)
  const networkIconUrl = networkIconByNetworkId[position.networkId]

  // TODO(sbw): use https://linear.app/valora/issue/ACT-1137
  return (
    <View testID={testID}>
      <Image source={{ uri: position.displayProps.imageUrl }} style={styles.positionImg} />
      {networkIconUrl ? (
        <FastImage
          source={{ uri: networkIconByNetworkId[position.networkId] }}
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
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  networkImage: {
    position: 'absolute',
  },
  positionImg: {
    width: 32,
    height: 32,
    borderRadius: 20,
    marginRight: Spacing.Regular16,
  },
})
