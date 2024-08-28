import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber'
import { getRegionCodeFromCountryCode } from 'src/utils/getRegionFromCountryCode'

const phoneUtil = PhoneNumberUtil.getInstance()

export function getExampleNumber(
  regionCode: string,
  useOnlyZeroes = true,
  isInternational = false
) {
  const examplePhone = phoneUtil.getExampleNumber(
    getRegionCodeFromCountryCode(regionCode) as string
  )

  if (!examplePhone) {
    return
  }

  const formatedExample = phoneUtil.format(
    examplePhone,
    isInternational ? PhoneNumberFormat.INTERNATIONAL : PhoneNumberFormat.NATIONAL
  )

  if (useOnlyZeroes) {
    if (isInternational) {
      return formatedExample.replace(/(^\+[0-9]{1,3} |[0-9])/g, (value, _, i) => (i ? '0' : value))
    }
    return formatedExample.replace(/[0-9]/g, '0')
  }

  return formatedExample
}
