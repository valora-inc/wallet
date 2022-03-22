import { InquiryAttributes } from 'react-native-persona'
import Logger from 'src/utils/Logger'

export function isUserRegionSupportedByFinclusive(
  address: InquiryAttributes['address'],
  unsupportedRegions: string[],
  tag: string
): Boolean {
  if (!address || !address.countryCode || !address.subdivisionAbbr) {
    Logger.error(tag, 'Persona inquiry attributes missing address info')
    return false
  }
  if (address.countryCode !== 'US') {
    Logger.info(tag, 'User region country code not in US')
    return false
  }

  if (unsupportedRegions.includes(address.subdivisionAbbr)) {
    // Finclusive currently do not support residents of NY and TX
    Logger.info(tag, 'User region state not supported by finclusive')
    return false
  }
  return true
}
