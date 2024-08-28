import { parsePhoneNumber } from 'src/utils/parsePhoneNumber'

export function getDisplayPhoneNumber(phoneNumber: string, defaultCountryCode: string) {
  const phoneDetails = parsePhoneNumber(phoneNumber, defaultCountryCode)
  if (phoneDetails) {
    return phoneDetails.displayNumber
  } else {
    // Fallback to input instead of showing nothing for invalid numbers
    return phoneNumber
  }
}
