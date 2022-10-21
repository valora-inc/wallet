import BottomSheet from '@gorhom/bottom-sheet'
import { map } from 'lodash'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { currentForestSelector } from 'src/map/selector'
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
        acceptsGuilder,
        providesGuilder,
        street,
        building_number,
        city,
        account,
      } = v.attributes
      return {
        [name]: {
          tags: map(tags, (t: any) => t?.tag),
          logoURI: logo?.data?.attributes?.url,
          siteURI: website,
          title: name,
          subtitle: subtitle,
          phoneNumber: phone_number,
          street: street,
          building_number: building_number,
          city: city,
          location: {
            // The Latitude and Longitude attributes cannot be null or undefined
            // in the Android environment.
            // See https://github.com/react-native-maps/react-native-maps/issues/3159
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
          acceptsGuilder: Boolean(acceptsGuilder),
          providesGuilder: Boolean(providesGuilder),
          account: account,
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

export const useInteractiveBottomSheet = (
  bottomSheetRef: React.RefObject<BottomSheet>
): [string[]] => {
  const snapPoints = React.useMemo(() => ['10%', '24%', '50%', '80%'], [])
  const currentVendor = useSelector(currentVendorSelector)
  const currentForest = useSelector(currentForestSelector)

  useEffect(() => {
    handleVendorChange()
  }, [])

  useEffect(() => {
    handleVendorChange()
  }, [currentVendor, currentForest])

  const handleVendorChange = () => {
    if (currentVendor || currentForest) {
      bottomSheetRef.current?.snapToIndex(2)
    }
  }

  return [snapPoints]
}
