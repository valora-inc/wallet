import { PhoneNumberUtil } from 'google-libphonenumber'

const phoneUtil = PhoneNumberUtil.getInstance()

export function getRegionCode(e164PhoneNumber: string) {
  if (!e164PhoneNumber) {
    return null
  }
  try {
    return phoneUtil.getRegionCodeForNumber(phoneUtil.parse(e164PhoneNumber))
  } catch (error) {
    console.debug(`getRegionCodeForNumber, number: ${e164PhoneNumber}, error: ${error}`)
    return null
  }
}
