import { useWallet } from '@divvi/mobile'
import React from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { RootStackScreenProps } from './types'

export default function CustomScreen({ route }: RootStackScreenProps<'CustomScreen'>) {
  const { address, tokens } = useWallet()

  return (
    <View style={styles.container}>
      <Text style={styles.text}>route.params: {JSON.stringify(route.params)}</Text>
      <View style={styles.walletAddressContainer}>
        <Text style={[styles.text, styles.title]}>Wallet address:</Text>
        <Text style={styles.text}>{address}</Text>
      </View>

      <View style={styles.tokensContainer}>
        <Text style={[styles.text, styles.title]}>Tokens:</Text>
        <FlatList
          data={tokens}
          contentContainerStyle={styles.tokenList}
          renderItem={({ item }) => (
            <View key={item.tokenId} style={styles.singleTokenContainer}>
              <Text style={styles.text}>{item.name}:</Text>
              <Text style={styles.text}>
                {item.balance.toFixed()} {item.symbol}
              </Text>
            </View>
          )}
        ></FlatList>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    gap: 24,
    padding: 16,
  },
  walletAddressContainer: {
    gap: 8,
    flexShrink: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
  },
  tokensContainer: {
    gap: 8,
    flexShrink: 1,
  },
  tokenList: {
    gap: 8,
  },
  singleTokenContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
