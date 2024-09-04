/**
 * Reference files:
 * https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/base/src/address.ts
 * https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/utils/src/address.ts
 */

import { privateToPublic, toChecksumAddress } from '@ethereumjs/util'
import { Address, isAddress } from 'viem'
import { privateKeyToAddress as privateKeyToAddressViem } from 'viem/accounts'

/**
 * Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
 * into ['ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10']
 */
export function getAddressChunks(address: string) {
  return trimLeading0x(address).match(/.{1,4}/g) || []
}

export function trimLeading0x(address: string) {
  return address.startsWith('0x') ? address.slice(2) : address
}

export const normalizeAddressWith0x = (a: string) => ensureLeading0x(a).toLowerCase() as Address

export const ensureLeading0x = (input: string): Address =>
  input.startsWith('0x') ? (input as Address) : (`0x${input}` as const)

const hexToBuffer = (input: string) => Buffer.from(trimLeading0x(input), 'hex')

export const privateKeyToPublicKey = (privateKey: string) =>
  toChecksumAddress(ensureLeading0x(privateToPublic(hexToBuffer(privateKey)).toString('hex')))

export const privateKeyToAddress = (privateKey: string) =>
  privateKeyToAddressViem(ensureLeading0x(privateKey))

export const normalizeAddress = (a: string) => trimLeading0x(a).toLowerCase()

export const isValidAddress = (input: string | null | undefined): input is Address => {
  return input ? isAddress(input.toLowerCase()) : false
}
