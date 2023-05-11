import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Spacing } from 'src/styles/styles'
import AssetBalanceFiat from 'src/tokens/AssetBalanceFiat'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenBalances>

const AssetBalances = (props: Props) => {
  const renderItem = () => {
    return null
  }
  return (
    <SafeAreaView testID="AssetBalancesScreen" style={styles.safeAreaContainer} edges={['bottom']}>
      <FlatList
        style={styles.flatListContainer}
        data={[]}
        renderItem={renderItem}
        // keyExtractor={keyExtractor}
        ListHeaderComponent={<AssetBalanceFiat />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  flatListContainer: {
    paddingTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Thick24,
  },
})

export default AssetBalances
