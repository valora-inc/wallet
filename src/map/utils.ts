import { Linking, Share } from 'react-native'
import { LatLng } from 'react-native-maps'

export async function initiatePhoneCall(phonenumber: string) {
  await Linking.openURL(`tel:${phonenumber}`)
}

export type LinkingDirectionsOptions = {
  coordinate: LatLng
  buildingNumber?: number
  streetName?: string
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
  coordinate,
  buildingNumber,
  streetName,
  city,
}: LinkingDirectionsOptions) {
  if (coordinate) {
    // @todo Use coordinates
  } else if (buildingNumber && streetName && city) {
    // @todo Use address to open maps
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
