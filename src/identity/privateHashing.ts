import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { PhoneNumberUtils } from '@celo/phone-utils'
import { e164NumberSelector } from 'src/account/selectors'
import { E164NumberToSaltType } from 'src/identity/reducer'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import { select } from 'typed-redux-saga'

// Get the wallet user's own phone hash details if they're cached
// null otherwise
export function* getUserSelfPhoneHashDetails() {
  const e164Number = yield* select(e164NumberSelector)
  if (!e164Number) {
    return undefined
  }

  const saltCache: E164NumberToSaltType = yield* select(e164NumberToSaltSelector)
  const salt = saltCache[e164Number]

  if (!salt) {
    return undefined
  }

  const details: PhoneNumberHashDetails = {
    e164Number,
    pepper: salt,
    phoneHash: PhoneNumberUtils.getPhoneHash(e164Number, salt),
  }

  return details
}
