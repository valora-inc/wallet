/**
 * Reference function:
 * https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L12
 */

import { PhoneNumberUtil } from 'google-libphonenumber'
import Logger from 'src/utils/Logger'

const phoneUtil = PhoneNumberUtil.getInstance()

export function getCountryCode(e164PhoneNumber: string) {
  if (!e164PhoneNumber) {
    return null
  }
  try {
    return phoneUtil.parse(e164PhoneNumber).getCountryCode()
  } catch (error) {
    Logger.debug(`getCountryCode, number: ${e164PhoneNumber}, error: ${error}`)
    return null
  }
}