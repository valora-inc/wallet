import { InquiryAttributes } from 'react-native-persona'

export function isUserRegionSupportedByFinclusive(
  address: InquiryAttributes['address'],
  unsupportedRegions: string[]
): Boolean {
  if (!address || !address.countryCode || !address.subdivisionAbbr) {
    throw new Error('Persona inquiry attributes missing address info')
  }
  if (address.countryCode !== 'US') {
    return false
  }

  if (unsupportedRegions.includes(address.subdivisionAbbr)) {
    // Finclusive currently do not support residents of NY and TX
    return false
  }
  return true
}
