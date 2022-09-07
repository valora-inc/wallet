import React, { useEffect, useRef } from 'react'
import { Platform, StyleSheet } from 'react-native'
import MapView from 'react-native-maps'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import VendorMarker from 'src/icons/VendorMarker'
import { GMAP_STYLE, LOCALE_REGION } from 'src/map/constants'
import { useMap } from 'src/map/hooks'
import MapBottomSheet from 'src/map/MapBottomSheet'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import Colors from 'src/styles/colors'
import { setCurrentVendor } from 'src/vendors/actions'
import { vendorsWithLocationSelector } from 'src/vendors/selector'
import { VendorWithLocation } from 'src/vendors/types'

const MapScreen = () => {
  const scrollPosition = useRef(new Animated.Value(0)).current
  const dispatch = useDispatch()
  const vendors = useSelector(vendorsWithLocationSelector)
  const { mapRef, ...vendorData } = useMap()
  const { currentVendor } = vendorData

  const vendorLocationMarkers = () => (
    <>
      {vendors.map((vendor: VendorWithLocation) => (
        <VendorMarker
          title={vendor.title}
          coordinate={vendor.location}
          key={vendor.title}
          description={vendor.subtitle}
          onPress={() => dispatch(setCurrentVendor(vendor))}
          color={currentVendor === vendor ? Colors.currentVendor : Colors.inactiveVendor}
        />
      ))}
    </>
  )

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={LOCALE_REGION}
        customMapStyle={Platform.OS === 'android' ? GMAP_STYLE : undefined}
      >
        {vendors && vendorLocationMarkers()}
      </MapView>
      <MapBottomSheet />
      <DrawerTopBar scrollPosition={scrollPosition} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
})

export default MapScreen
