import { map } from 'lodash'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Vendor } from 'src/vendors/types'
import VendorDetailBottomSheet from 'src/vendors/VendorDetailBottomSheet'
import VendorListItem from 'src/vendors/VendorListItem'
import { CuracaoVendors } from 'src/vendors/vendors'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export default function VendorsScreen() {
  const sections = map(CuracaoVendors, (vendor: Vendor) => {
    return vendor
  })

  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null)

  const renderItem = ({ item, index }: any) => (
    <VendorListItem vendor={item} key={index} onPress={() => setCurrentVendor(item)} />
  )

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const handleSelectVendor = () => {
    navigate(Screens.QRNavigator, { screen: Screens.QRScanner })
    setCurrentVendor(null)
  }

  return (
    <SafeAreaView>
      <AnimatedFlatList
        testID={'Vendors/List'}
        scrollEventThrottle={16}
        style={styles.container}
        data={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
      <VendorDetailBottomSheet
        vendor={currentVendor}
        dismiss={() => setCurrentVendor(null)}
        select={() => handleSelectVendor()}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
})
