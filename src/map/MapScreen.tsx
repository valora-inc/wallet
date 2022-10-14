import { map } from 'lodash'
import React, { useRef } from 'react'
import { Platform, StyleSheet } from 'react-native'
import MapView, { Geojson } from 'react-native-maps'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import ForestMarker from 'src/icons/ForestMarker'
import VendorMarker from 'src/icons/VendorMarker'
import { setFoodForest } from 'src/map/actions'
import { GMAP_STYLE, LOCALE_REGION, MapCategory } from 'src/map/constants'
import { useMap } from 'src/map/hooks'
import MapBottomSheet from 'src/map/MapBottomSheet'
import { currentMapCategorySelector, foodForestsSelector } from 'src/map/selector'
import { FoodForest } from 'src/map/types'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import Colors from 'src/styles/colors'
import { setCurrentVendor } from 'src/vendors/actions'
import { vendorsWithLocationSelector } from 'src/vendors/selector'
import { VendorWithLocation } from 'src/vendors/types'

const MapScreen = () => {
  const scrollPosition = useRef(new Animated.Value(0)).current
  const dispatch = useDispatch()
  const mapCategory = useSelector(currentMapCategorySelector)
  const forests = useSelector(foodForestsSelector)
  const vendors = useSelector(vendorsWithLocationSelector)
  const { mapRef, ...vendorData } = useMap()
  const { currentVendor } = vendorData

  const vendorLocationMarkers = () => {
    if (!mapCategory.includes(MapCategory.Vendor)) return
    return (
      <>
        {vendors.map((vendor: VendorWithLocation) => (
          <VendorMarker
            title={vendor.title}
            coordinate={vendor.location}
            key={vendor.title}
            description={vendor.subtitle}
            onPress={() => dispatch(setCurrentVendor(vendor))}
            color={currentVendor === vendor ? Colors.activeMarker : Colors.inactiveVendor}
          />
        ))}
      </>
    )
  }

  const forestLocationMarkers = () => {
    if (!mapCategory.includes(MapCategory.FoodForest)) return // forest is selected
    return (
      <>
        {map(forests, (forest: FoodForest) => {
          return (
            <ForestMarker
              title={forest.title}
              coordinate={forest.ingress || { latitude: 0, longitude: 0 }}
              key={forest.title}
              onPress={() => dispatch(setFoodForest(forest))}
            />
          )
        })}
      </>
    )
  }

  const renderGeojsonLayer = () => {
    if (!mapCategory.includes(MapCategory.FoodForest)) return
    return (
      <>
        {map(forests, (forest: FoodForest) => {
          return (
            <Geojson
              geojson={forest.data}
              strokeColor={Colors.goldUI}
              strokeWidth={StyleSheet.hairlineWidth}
              fillColor={Colors.goldFaint}
            />
          )
        })}
      </>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={LOCALE_REGION}
        customMapStyle={Platform.OS === 'android' ? GMAP_STYLE : undefined}
      >
        {forests && renderGeojsonLayer()}
        {forests && forestLocationMarkers()}
        {vendors && vendorLocationMarkers()}
      </MapView>
      <DrawerTopBar scrollPosition={scrollPosition} />
      <MapBottomSheet mapRef={mapRef} />
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
