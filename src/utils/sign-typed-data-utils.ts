/**
 * Reference file:
 * https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts
 */
import type BigNumber from 'bignumber.js'

interface EIP712Parameter {
  name: string
  type: string
}

interface EIP712Types {
  [key: string]: EIP712Parameter[]
}

type EIP712ObjectValue =
  | string
  | number
  | BigNumber
  | boolean
  | Buffer
  | EIP712Object
  | EIP712ObjectValue[]

interface EIP712Object {
  [key: string]: EIP712ObjectValue
}

export interface EIP712TypedData {
  types: EIP712Types & { EIP712Domain: EIP712Parameter[] }
  domain: EIP712Object
  message: EIP712Object
  primaryType: string
}
