import { InquiryAttributes } from 'react-native-persona'

export function isUserRegionSupportedByFinclusive(
  address: InquiryAttributes['address'],
  unsupportedRegions: string[]
): Boolean {
  if (!address || !address.countryCode || !address.subdivisionAbbr) {
    throw new Error('Persona inquiry attributes missing address info')
  }
  if (address.countryCode !== 'US') {
    throw new Error('User region country code not in US')
  }

  if (unsupportedRegions.includes(address.subdivisionAbbr)) {
    // Finclusive currently do not support residents of NY and TX
    throw new Error('User region state not supported by finclusive')
  }
  return true
}
