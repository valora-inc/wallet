import { ensureLeading0x } from '@celo/base/lib/address'
import userManagementClient from './UserManagementClient'

export function hexToBase64(hex: string) {
  return Buffer.from(hex.replace('0x', ''), 'hex').toString('base64')
}

export function base64ToHex(base64: string) {
  return ensureLeading0x(Buffer.from(base64, 'base64').toString('hex'))
}

const { createUser, verifyEmail } = userManagementClient

export { createUser, verifyEmail }
