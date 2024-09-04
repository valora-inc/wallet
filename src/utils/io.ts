import { isValidAddress, toChecksumAddress } from '@ethereumjs/util'
import { either } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { isE164NumberStrict } from 'src/utils/phoneNumbers'

// Ref: https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/phone-utils/src/io.ts#L6
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

// Ref: https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/phone-utils/src/io.ts#L25
export type E164Number = t.TypeOf<typeof E164PhoneNumberType>

// Ref: https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/utils/src/io.ts#L38
export const AddressType = new t.Type<string, string, unknown>(
  'Address',
  t.string.is,
  (input, context) =>
    either.chain(t.string.validate(input, context), (stringValue) =>
      isValidAddress(stringValue)
        ? t.success(toChecksumAddress(stringValue))
        : t.failure(stringValue, context, 'is not a valid address')
    ),
  String
)
