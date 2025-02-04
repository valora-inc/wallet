/**
 * Reference file:
 * https://github.com/celo-org/developer-tooling/blob/8572a0f978d1aa01a36775ef4be48c3eafdbb204/packages/sdk/phone-utils/src/getPhoneHash.ts
 *
 * The file was removed in later versions of @celo/phone-utils so the function
 * is taken in its final form before removal.
 */

import { getIdentifierHash, getPrefixedIdentifier, IdentifierPrefix } from 'src/utils/identifier'
import { soliditySha3 } from 'web3-utils'

/**
 * Rerefence implementation uses "web3-utils" version 1.3.6:
 * https://github.com/celo-org/developer-tooling/blob/8572a0f978d1aa01a36775ef4be48c3eafdbb204/packages/sdk/base/package.json#L30
 *
 * In that version the function "soliditySha3" returns "string | null" while the latest version of "web3-utils"
 * returns "string | undefined". For the sake of compatibility with the original implementation while
 * also using the latest version of "web3-utils" "?? null" was added to replace possible undefined with null.
 */
const sha3 = (v: string): string | null => soliditySha3({ type: 'string', value: v }) ?? null
const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  if (salt) {
    return getIdentifierHash(sha3, phoneNumber, IdentifierPrefix.PHONE_NUMBER, salt)
  }
  // backwards compatibility for old phoneUtils getPhoneHash
  return sha3(getPrefixedIdentifier(phoneNumber, IdentifierPrefix.PHONE_NUMBER)) as string
}

export default getPhoneHash
