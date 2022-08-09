import { map } from 'lodash'
import React, { useRef, useState } from 'react'
import { RefreshControl, RefreshControlProps, StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { fetchVendors } from 'src/vendors/actions'
import { vendorLoadingSelector, vendorsSelector } from 'src/vendors/selector'
import { Vendor } from 'src/vendors/types'
import VendorDetailBottomSheet from 'src/vendors/VendorDetailBottomSheet'
import VendorListItem from 'src/vendors/VendorListItem'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export default function VendorsScreen() {
  const dispatch = useDispatch()
  const vendors = useSelector(vendorsSelector)
  const isLoading = useSelector(vendorLoadingSelector)

  const sections = map(vendors, (vendor: Vendor) => {
    return vendor
  })

  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null)

  const renderItem = ({ item, index }: any) => (
    <VendorListItem vendor={item} id={index} onPress={() => setCurrentVendor(item)} />
  )

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const handleSelectVendor = () => {
    navigate(Screens.QRNavigator, { screen: Screens.QRScanner })
    setCurrentVendor(null)
  }

  const onRefresh = async () => {
    dispatch(fetchVendors())
  }

  const refresh: React.ReactElement<RefreshControlProps> = (
    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.greenUI]} />
  ) as React.ReactElement<RefreshControlProps>

  const scrollPosition = useRef(new Animated.Value(0)).current

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])

  return (
    <SafeAreaView style={{ height: '100%', width: '100%' }}>
      <AnimatedFlatList
        testID={'Vendors/List'}
        scrollEventThrottle={16}
        style={styles.container}
        data={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={refresh}
        onRefresh={onRefresh}
        refreshing={isLoading}
        onScroll={onScroll}
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
    height: '100%',
    width: '100%',
  },
})
