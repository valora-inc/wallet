import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useSelector } from 'react-redux'
import { AbstractPosition } from 'src/positions/types'
import { tokensListSelector } from 'src/tokens/selectors'
import { BaseToken } from 'src/tokens/slice'

interface Props {
  token: BaseToken | AbstractPosition
  viewStyle?: StyleProp<ViewStyle>
  testID?: string
}

// Temporary until isNative is populated throughout address metadata
const nativeTokenAddresses = [
  '0x471ece3750da237f93b8e339c536989b8978a438', // Celo Mainnet
  '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9', // Celo Alfajores
]

export default function TokenIcon({ token, viewStyle, testID }: Props) {
  const isToken = 'symbol' in token
  const tokens = useSelector(tokensListSelector)

  // Always defaults to Celo as token.network is not currently defined
  // Switch statement for easier future expansion
  let networkImage
  switch (token.network) {
    default:
    case 'Celo':
      networkImage = tokens.find((token) => token.symbol === 'CELO')?.imageUrl
      break
    case 'Ethereum':
      networkImage = tokens.find((token) => token.symbol === 'ETH')?.imageUrl
      break
  }

  return (
    <View testID={testID} style={viewStyle}>
      <FastImage
        source={{
          uri: isToken ? token.imageUrl : token.displayProps.imageUrl,
        }}
        style={styles.mainTokenImage}
        testID={testID ? `${testID}/TokenIcon` : 'TokenIcon'}
      />
      {!nativeTokenAddresses.includes(token.address) && (
        <FastImage
          source={{ uri: networkImage }}
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
