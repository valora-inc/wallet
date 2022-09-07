import { useEffect, useRef } from 'react'
import MapView from 'react-native-maps'
import { LOCALE_OFFSET } from 'src/map/constants'
import { useCurrentVendorLocation } from 'src/vendors/hooks'

export const useMap = () => {
  const mapRef = useRef<MapView>(null)
  const { currentVendor, vendorLocation } = useCurrentVendorLocation()

  useEffect(() => {
    vendorLocation &&
      mapRef.current?.animateToRegion({
        ...vendorLocation,
        ...LOCALE_OFFSET,
      })
  }, [vendorLocation])

  return { mapRef, currentVendor, vendorLocation }
}
