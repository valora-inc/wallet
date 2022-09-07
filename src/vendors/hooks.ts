import { useEffect, useState } from 'react'
import { LatLng } from 'react-native-maps'
import { useSelector } from 'react-redux'
import { LOCALE_LATLNG } from 'src/map/constants'
import { currentVendorSelector } from 'src/vendors/selector'
import { VendorWithLocation } from 'src/vendors/types'
import { hasValidLocation } from 'src/vendors/utils'

/**
 * This custom hook will return the latest vendor selected from the
 * redux store as well as its computed location. If the location of
 * the latest vendor is invalid, it will return the latest location
 * from the local state of this hook.
 */
export const useCurrentVendorLocation = () => {
  const currentVendor = useSelector(currentVendorSelector) as VendorWithLocation
  const [vendorLocation, setLocation] = useState<LatLng>(LOCALE_LATLNG)
  useEffect(() => {
    if (currentVendor && hasValidLocation(currentVendor)) {
      setLocation(currentVendor.location)
    }
  }, [currentVendor])
  return { currentVendor, vendorLocation }
}
