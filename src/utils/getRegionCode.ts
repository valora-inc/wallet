/**
 * Reference function:
 * https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L24
 */

import { PhoneNumberUtil } from 'google-libphonenumber'
import Logger from 'src/utils/Logger'

const phoneUtil = PhoneNumberUtil.getInstance()

export function getRegionCode(e164PhoneNumber: string) {
  if (!e164PhoneNumber) {
    return null
  }
  try {
    return phoneUtil.getRegionCodeForNumber(phoneUtil.parse(e164PhoneNumber))
  } catch (error) {
    Logger.debug(`getRegionCodeForNumber, number: ${e164PhoneNumber}, error: ${error}`)
    return null
  }
}
