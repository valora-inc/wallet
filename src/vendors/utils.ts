import BottomSheet from '@gorhom/bottom-sheet'
import { map } from 'lodash'
import React, { useEffect, useState } from 'react'
import { LatLng } from 'react-native-maps'
import { useSelector } from 'react-redux'
import { LOCALE_LATLNG } from 'src/map/constants'
import { currentVendorSelector } from 'src/vendors/selector'
import { Vendor, Vendors, VendorWithLocation } from 'src/vendors/types'

/**
 * Formats the REST API response to a format that is more usable in the app.
 * @param vendorObject Vendor object
 * @returns {Vendors}
 */
export const formatVendors = (vendorObject: any): Vendors => {
  const { data } = vendorObject
  const result = Object.assign(
    {},
    ...data.map((v: any) => {
      const {
        name,
        subtitle,
        logo,
        tags,
        website,
        latitude,
        longitude,
        phone_number,
      } = v.attributes
      return {
        [name]: {
          tags: map(tags, (t: any) => t?.tag),
          logoURI: logo?.data?.attributes?.url,
          siteURI: website,
          title: name,
          subtitle: subtitle,
          phoneNumber: phone_number,
          location: {
            // The Latitude and Longitude attributes cannot be null or undefined
            // in the Android environment.
            // See https://github.com/react-native-maps/react-native-maps/issues/3159
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
        } as Vendor | VendorWithLocation,
      }
    })
  )
  return result
}

/**
 * Determine whether the vendor has a valid LatLng coordinate defined.
 * @param vendor Vendor object
 * @returns boolean
 */
export const hasValidLocation = (vendor: VendorWithLocation): boolean => {
  const { location } = vendor
  const { latitude, longitude } = location
  return !!latitude && !!longitude
}

/**
 * This custom hook will return the latest vendor selected from the
 * redux store as well as its computed location. If the location of
 * the latest vendor is invalid, it will return the latest location
 * from the local state of this hook.
 */
export const useCurrentVendorLocation = () => {
  const currentVendor = useSelector(currentVendorSelector) as VendorWithLocation
  const [location, setLocation] = useState<LatLng>(LOCALE_LATLNG)
  useEffect(() => {
    if (currentVendor && hasValidLocation(currentVendor)) {
      setLocation(currentVendor.location)
    }
  }, [currentVendor])
  return { currentVendor, location }
}

export const useInteractiveBottomSheet = (bottomSheetRef: React.RefObject<BottomSheet>) => {
  const snapPoints = React.useMemo(() => ['8%', '25%', '50%', '80%'], [])
  const currentVendor = useSelector(currentVendorSelector)
  useEffect(() => {
    handleVendorChange()
  }, [])

  useEffect(() => {
    handleVendorChange()
  }, [currentVendor])

  const handleVendorChange = () => {
    if (currentVendor) {
      bottomSheetRef.current?.snapToIndex(2)
    } else {
      bottomSheetRef.current?.snapToIndex(0)
    }
  }
  return snapPoints
}
