/**
 * Reference file:
 * https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/phone-utils/src/io.ts
 */

import { either } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { isE164NumberStrict } from 'src/utils/phoneNumbers'

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
