import { some } from 'lodash'
import { Linking, Platform, Share } from 'react-native'
import { LatLng } from 'react-native-maps'
import Logger from 'src/utils/Logger'
import { Vendor, Vendors, VendorWithLocation } from 'src/vendors/types'

export async function initiatePhoneCall(phonenumber: string) {
  await Linking.openURL(`tel:${phonenumber}`)
}

export type LinkingDirectionsOptions = {
  title: string
  coordinate: LatLng
  building_number?: string
  street?: string
  city?: string
}

/**
 * The linking library requires content inputs,
 * in order to open the share dialog.
 *
 * N.B. One of "message" or "url" must be provided.
 */
export type LinkingShareContentOptions = {
  title?: string
  url?: string
  message: string
}

export type LinkingShareOptions = {
  dialogTitle?: string
  subject?: string
  excludedActivityTypes?: string[]
  tintColor?: string
}

export function initiateDirection({
  title,
  coordinate,
  building_number,
  street,
  city,
}: LinkingDirectionsOptions) {
  if (coordinate.latitude !== 0 && coordinate.longitude !== 0) {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' })
    const latLng = `${coordinate.latitude},${coordinate.longitude}`
    const url = Platform.select({
      ios: `${scheme}${title}@${latLng}`,
      android: `${scheme}${latLng}(${title})`,
    }) as string

    Linking.openURL(url).catch((e) =>
      Logger.error('DirectionsError', `Directions could not be opened.`, e)
    )
  } else if (street) {
    const destination = encodeURIComponent(`${street} ${building_number}, ${city}`)
    const url = Platform.select({
      ios: `maps:0,0?q=${destination}`,
      android: `geo:0,0?q=${destination}`,
    }) as string

    Linking.openURL(url).catch((e) =>
      Logger.error('DirectionsError', `Directions could not be opened.`, e)
    )
  } else {
    throw new Error('Directions could not be found.')
  }
}
export async function initiateShare(
  content: LinkingShareContentOptions,
  options?: LinkingShareOptions
) {
  try {
    const result = await Share.share({ ...content }, options)
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
      } else {
        // shared
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    // @todo handle share error
  }
}

export function filterVendors(search: string, vendors: Vendors): (Vendor | VendorWithLocation)[] {
  const vendorsList = Object.values(vendors)

  const filteredVendors = vendorsList.filter(
    (vendor) =>
      vendor.title.toLowerCase().includes(search.toLowerCase()) ||
      some(vendor.tags, (tag) => tag.toLowerCase().includes(search.toLowerCase()))
  )
  return filteredVendors
}

export function formatAge(date: number | Date | undefined) {
  if (date === null || date === undefined) return [0, 0, 0]
  date = new Date(date)
  const now = new Date()
  const years = Math.abs(date.getFullYear() - now.getFullYear())
  const months = Math.abs(date.getMonth() - now.getMonth())
  const days = Math.abs(date.getDate() - now.getDate())
  return [years, months, days]
}
