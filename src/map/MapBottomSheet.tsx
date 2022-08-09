import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { useRef } from 'react'
import { ListRenderItemInfo, StyleSheet, Text } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import fontStyles from 'src/styles/fonts'
import { setCurrentVendor } from 'src/vendors/actions'
import { currentVendorSelector, vendorsSelector } from 'src/vendors/selector'
import { Vendor, VendorWithLocation } from 'src/vendors/types'
import { useInteractiveBottomSheet } from 'src/vendors/utils'
import VendorDetails from 'src/vendors/VendorDetails'
import VendorListItem from 'src/vendors/VendorListItem'

type Props = {}

const MapBottomSheet = () => {
  const dispatch = useDispatch()
  const vendors = Object.values(useSelector(vendorsSelector))
  const currentVendor = useSelector(currentVendorSelector)

  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useInteractiveBottomSheet(bottomSheetRef)

  const renderVendorItem = ({ item }: ListRenderItemInfo<Vendor | VendorWithLocation>) => {
    return (
      <VendorListItem
        vendor={item}
        id={item.title}
        onPress={() => dispatch(setCurrentVendor(item))}
      />
    )
  }

  return (
    <BottomSheet ref={bottomSheetRef} index={0} snapPoints={snapPoints}>
      <Text style={styles.header}>{!currentVendor && `Vendors`}</Text>
      {!currentVendor && (
        <BottomSheetFlatList
          data={vendors}
          keyExtractor={(vendor: Vendor) => vendor.title}
          renderItem={renderVendorItem}
          contentContainerStyle={styles.innerContainer}
        />
      )}
      {currentVendor && (
        <VendorDetails
          vendor={currentVendor}
          close={() => dispatch(setCurrentVendor(undefined))}
          action={() => {}}
        />
      )}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    ...fontStyles.h1,
  },
  innerContainer: {},
})

export default MapBottomSheet
