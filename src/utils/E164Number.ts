import { either } from 'fp-ts/lib/Either'
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber'
import * as t from 'io-ts'

const phoneUtil = PhoneNumberUtil.getInstance()

// Actually runs through the parsing instead of using a regex
export function isE164NumberStrict(phoneNumber: string) {
  try {
    const parsedPhoneNumber = phoneUtil.parse(phoneNumber)
    if (!phoneUtil.isValidNumber(parsedPhoneNumber)) {
      return false
    }
    return phoneUtil.format(parsedPhoneNumber, PhoneNumberFormat.E164) === phoneNumber
  } catch {
    return false
  }
}

export const E164PhoneNumberType = new t.Type<string, string, unknown>(
  'E164Number',
  t.string.is,
  (input, context) =>
    either.chain(t.string.validate(input, context), (stringValue) =>
      isE164NumberStrict(stringValue)
        ? t.success(stringValue)
        : t.failure(stringValue, context, 'is not a valid e164 number')
    ),
  String
)

export type E164Number = t.TypeOf<typeof E164PhoneNumberType>
