import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import MapView from 'react-native-maps'
import { useDispatch, useSelector } from 'react-redux'
import { setFoodForest } from 'src/map/actions'
import { MapCategory } from 'src/map/constants'
import FoodForestDetails from 'src/map/FoodForestDetails'
import MapSheetHandle from 'src/map/MapSheetHandle'
import {
  currentForestSelector,
  filteredVendorsSelector,
  searchQuerySelector,
} from 'src/map/selector'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { setCurrentVendor } from 'src/vendors/actions'
import { currentVendorSelector, vendorsSelector } from 'src/vendors/selector'
import { Vendor, VendorWithLocation } from 'src/vendors/types'
import { useInteractiveBottomSheet } from 'src/vendors/utils'
import VendorDetails from 'src/vendors/VendorDetails'
import VendorListItem from 'src/vendors/VendorListItem'

type Props = {
  mapRef: React.RefObject<MapView>
}

const MapBottomSheet = ({ mapRef }: Props) => {
  const dispatch = useDispatch()
  const vendors = Object.values(useSelector(vendorsSelector))
  const filteredVendors = Object.values(useSelector(filteredVendorsSelector))
  const searchQuery = Object.values(useSelector(searchQuerySelector))

  const currentVendor = useSelector(currentVendorSelector)
  const currentForest = useSelector(currentForestSelector)

  const bottomSheetRef = useRef<BottomSheet>(null)
  const [snapPoints] = useInteractiveBottomSheet(bottomSheetRef)
  const [listMode, setListMode] = useState<boolean>(false)

  useEffect(() => {
    setListMode(listMode || !!searchQuery.length)
  }, [searchQuery])

  const renderVendorItem = ({ item }: ListRenderItemInfo<Vendor | VendorWithLocation>) => {
    return (
      <VendorListItem
        listMode={listMode}
        vendor={item}
        id={item.title}
        onPress={() => dispatch(setCurrentVendor(item))}
      />
    )
  }

  const toggleVendorListMode = (index: number) => {
    if (index >= 2) setListMode(true)
    else setListMode(!!searchQuery.length)
  }

  const renderHandle = useCallback(
    (props) => (
      <MapSheetHandle title={MapCategory.All} {...props} ref={bottomSheetRef} mapRef={mapRef} />
    ),
    []
  )

  /** */
  const handleVendorAction = () => {
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      handleComponent={renderHandle}
      onChange={toggleVendorListMode}
      style={styles.sheet}
    >
      {!currentVendor && !currentForest && (
        <BottomSheetFlatList
          key={!listMode ? 'VendorList/Icons' : 'VendorList/List'}
          numColumns={!listMode ? 4 : 1}
          data={searchQuery.length > 0 ? filteredVendors : vendors}
          keyExtractor={(vendor: Vendor) => vendor.title}
          renderItem={renderVendorItem}
          contentContainerStyle={!listMode ? styles.innerContainer : null}
        />
      )}
      {currentVendor && (
        <VendorDetails
          vendor={currentVendor}
          close={() => dispatch(setCurrentVendor(undefined))}
          action={handleVendorAction}
        />
      )}
      {currentForest && (
        <FoodForestDetails
          forest={currentForest}
          close={() => dispatch(setFoodForest(undefined))}
          action={handleVendorAction}
        />
      )}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  innerContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  sheet: {
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,
    elevation: 24,
  },
})

export default MapBottomSheet
