import { parsePhoneNumber } from '@celo/phone-utils'

const ADDRESS_LENGTH = 42 // TODO(ACT-1173): see if this can be replaced with a viem helper

export const isAddressFormat = (content: string): boolean => {
  return content.startsWith('0x') && content.length === ADDRESS_LENGTH
}

export function getPhoneNumberDetails(
  phoneNumber: string,
  countryCallingCode: string,
  countryCodeAlpha2: string
) {
  const phoneDetails = parsePhoneNumber(phoneNumber, countryCallingCode)

  if (phoneDetails) {
    return {
      // Show international display number to avoid confusion
      internationalPhoneNumber: phoneDetails.displayNumberInternational,
      e164Number: phoneDetails.e164Number,
      isValidNumber: true,
      countryCodeAlpha2: phoneDetails.regionCode!,
    }
  } else {
    return {
      internationalPhoneNumber: phoneNumber,
      e164Number: '',
      isValidNumber: false,
      countryCodeAlpha2,
    }
  }
}
