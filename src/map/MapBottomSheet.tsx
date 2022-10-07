import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { useCallback, useRef } from 'react'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { MapCategory } from 'src/map/constants'
import MapSheetHandle from 'src/map/MapSheetHandle'
import { filteredVendorsSelector, searchQuerySelector } from 'src/map/selector'
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
  const filteredVendors = Object.values(useSelector(filteredVendorsSelector))
  const searchQuery = Object.values(useSelector(searchQuerySelector))

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

  const renderHandle = useCallback(
    (props) => <MapSheetHandle title={MapCategory.All} {...props} />,
    []
  )

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      handleComponent={renderHandle}
    >
      {!currentVendor && (
        <BottomSheetFlatList
          data={searchQuery.length > 0 ? filteredVendors : vendors}
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
  innerContainer: {},
})

export default MapBottomSheet
