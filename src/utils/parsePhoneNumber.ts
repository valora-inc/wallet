import {
  PhoneNumberFormat,
  PhoneNumberType,
  PhoneNumberUtil,
  type PhoneNumber,
} from 'google-libphonenumber'
import { getRegionCodeFromCountryCode } from 'src/utils/getRegionFromCountryCode'
import Logger from 'src/utils/Logger'

const phoneUtil = PhoneNumberUtil.getInstance()

interface ParsedPhoneNumber {
  e164Number: string
  displayNumber: string
  displayNumberInternational: string
  countryCode?: number
  regionCode?: string
}

const MIN_PHONE_LENGTH = 4

export function parsePhoneNumber(
  phoneNumberRaw: string,
  defaultCountryCode?: string
): ParsedPhoneNumber | null {
  try {
    if (!phoneNumberRaw || phoneNumberRaw.length < MIN_PHONE_LENGTH) {
      return null
    }

    const defaultRegionCode = defaultCountryCode
      ? getRegionCodeFromCountryCode(defaultCountryCode)
      : null
    const parsedNumberUnfixed = phoneUtil.parse(phoneNumberRaw, defaultRegionCode || undefined)
    const parsedCountryCode = parsedNumberUnfixed.getCountryCode()
    const parsedRegionCode = phoneUtil.getRegionCodeForNumber(parsedNumberUnfixed)
    const parsedNumber = handleSpecialCasesForParsing(
      parsedNumberUnfixed,
      parsedCountryCode,
      parsedRegionCode
    )

    if (!parsedNumber) {
      return null
    }

    const isValid = phoneUtil.isValidNumberForRegion(parsedNumber, parsedRegionCode)

    return isValid
      ? {
          e164Number: phoneUtil.format(parsedNumber, PhoneNumberFormat.E164),
          displayNumber: handleSpecialCasesForDisplay(parsedNumber, parsedCountryCode),
          displayNumberInternational: phoneUtil.format(
            parsedNumber,
            PhoneNumberFormat.INTERNATIONAL
          ),
          countryCode: parsedCountryCode,
          regionCode: parsedRegionCode,
        }
      : null
  } catch (error) {
    Logger.debug(`phoneNumbers/parsePhoneNumber/Failed to parse phone number, error: ${error}`)
    return null
  }
}

/**
 * Some countries require a prefix before the area code depending on if the number is
 * mobile vs landline and international vs national
 */

function prependToFormMobilePhoneNumber(
  parsedNumber: PhoneNumber,
  regionCode: string,
  prefix: string
) {
  if (phoneUtil.getNumberType(parsedNumber) === PhoneNumberType.MOBILE) {
    return parsedNumber
  }

  let nationalNumber = phoneUtil.format(parsedNumber, PhoneNumberFormat.NATIONAL)
  // Nationally formatted numbers sometimes contain leading 0
  if (nationalNumber.charAt(0) === '0') {
    nationalNumber = nationalNumber.slice(1)
  }
  // If the number already starts with prefix, don't prepend it again
  if (nationalNumber.startsWith(prefix)) {
    return null
  }

  const adjustedNumber = phoneUtil.parse(prefix + nationalNumber, regionCode)
  return phoneUtil.getNumberType(adjustedNumber) === PhoneNumberType.MOBILE ? adjustedNumber : null
}

function handleSpecialCasesForParsing(
  parsedNumber: PhoneNumber,
  countryCode?: number,
  regionCode?: string
) {
  if (!countryCode || !regionCode) {
    return parsedNumber
  }

  switch (countryCode) {
    // Argentina
    // https://github.com/googlei18n/libphonenumber/blob/master/FAQ.md#why-is-this-number-from-argentina-ar-or-mexico-mx-not-identified-as-the-right-number-type
    // https://en.wikipedia.org/wiki/Telephone_numbers_in_Argentina
    case 54:
      return prependToFormMobilePhoneNumber(parsedNumber, regionCode, '9')

    default:
      return parsedNumber
  }
}

// TODO(Rossy) Given the inconsistencies of numbers around the world, we should
// display e164 everywhere to ensure users knows exactly who their sending money to
function handleSpecialCasesForDisplay(parsedNumber: PhoneNumber, countryCode?: number) {
  switch (countryCode) {
    // Argentina
    // The Google lib formatter incorretly adds '15' to the nationally formatted number for Argentina
    // However '15' is only needed when calling a mobile from a landline
    case 54:
      return phoneUtil
        .format(parsedNumber, PhoneNumberFormat.INTERNATIONAL)
        .replace(/\+54(\s)?/, '')

    case 231:
      const formatted = phoneUtil.format(parsedNumber, PhoneNumberFormat.NATIONAL)
      return formatted && formatted[0] === '0' ? formatted.slice(1) : formatted

    default:
      return phoneUtil.format(parsedNumber, PhoneNumberFormat.NATIONAL)
  }
}
