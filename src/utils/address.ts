/**
 * Reference files:
 * https://github.com/celo-org/developer-tooling/blob/6e3372f5ada20bb59d88e275170be4dae1e99f01/packages/sdk/base/src/address.ts
 * https://github.com/celo-org/developer-tooling/blob/5cfd16214ca7ef7a7ff428c7d397933b3e1eeb51/packages/sdk/utils/src/address.ts
 */

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

const ensureLeading0x = (input: string): Address =>
  input.startsWith('0x') ? (input as Address) : (`0x${input}` as const)

export const privateKeyToAddress = (privateKey: string) =>
  privateKeyToAddressViem(ensureLeading0x(privateKey))

export const normalizeAddress = (a: string) => trimLeading0x(a).toLowerCase()

export const isValidAddress = (input: string | null | undefined): input is Address => {
  return input ? isAddress(input.toLowerCase()) : false
}
