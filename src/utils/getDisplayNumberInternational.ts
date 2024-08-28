import { getCountryCode } from 'src/utils/getCountryCode'
import { parsePhoneNumber } from 'src/utils/parsePhoneNumber'

export function getDisplayNumberInternational(e164PhoneNumber: string) {
  const countryCode = getCountryCode(e164PhoneNumber)
  const phoneDetails = parsePhoneNumber(e164PhoneNumber, (countryCode || '').toString())
  if (phoneDetails) {
    return phoneDetails.displayNumberInternational
  } else {
    // Fallback to input instead of showing nothing for invalid numbers
    return e164PhoneNumber
  }
}
