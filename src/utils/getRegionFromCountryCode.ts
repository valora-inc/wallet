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
