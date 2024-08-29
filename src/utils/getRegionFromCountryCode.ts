/**
 * Reference function:
 * https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L36
 */

import { PhoneNumberUtil } from 'google-libphonenumber'
import Logger from 'src/utils/Logger'

const phoneUtil = PhoneNumberUtil.getInstance()

export function getRegionCodeFromCountryCode(countryCode: string) {
  if (!countryCode) {
    return null
  }
  try {
    return phoneUtil.getRegionCodeForCountryCode(parseInt(countryCode, 10))
  } catch (error) {
    Logger.debug(`getRegionCodeFromCountryCode, countrycode: ${countryCode}, error: ${error}`)
    return null
  }
}
