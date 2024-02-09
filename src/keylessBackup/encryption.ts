import * as secp from '@noble/secp256k1'
import crypto from 'crypto'
import hkdf from 'futoin-hkdf'
import { fromBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

/**
 * Derives a key using the HKDF method from two key shares.
 *
 * @param {string} keyshare1 - The first keyshare in utf8 format.
 * @param {string} keyshare2 - The second keyshare in utf8 format.
 * @param {number} outputKeyBytes - The number of bytes to output. Defaults to 32.
 * @returns {Buffer} A derived key as a Buffer.
 */
export function deriveKeyFromKeyShares(
  keyshare1: Buffer,
  keyshare2: Buffer,
  outputKeyBytes: number = 32
): Buffer {
  // sanity check
  if (keyshare1.length < 16 || keyshare2.length < 16) {
    throw new Error('Key shares must be at least 16 bytes long')
  }

  // Combining the keyshares
  const salt = 'd922444e-ef5d-4921-b19d-ceec3780e704'
  const info = 'valora.keylessBackup.deriveKeyFromKeyShares'
  const combinedKeyShares = Buffer.concat([
    keyshare1,
    hkdf(keyshare2, 32, {
      // per advice from @nategraf: [using 32 here] gives the maximum available security available with SHA-256, and prevents a bit of wasted work if the requested output is longer than 32 bytes
      salt,
      info,
      hash: 'SHA-256',
    }),
  ])

  return hkdf(combinedKeyShares, outputKeyBytes, {
    salt,
    info,
    hash: 'SHA-256',
  })
}

/**
 * Derives a 256-bit key using the HKDF method from two key shares then derives a secp256k1 pair from that.
 *
 * @param {string} keyshare1 - The first keyshare in utf8 format.
 * @param {string} keyshare2 - The second keyshare in utf8 format.
 */
export function getSecp256K1KeyPair(
  keyshare1: Buffer,
  keyshare2: Buffer
): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const derivedKey = deriveKeyFromKeyShares(keyshare1, keyshare2, 48) // 40 is the minimum for hashToPrivateKey
  const privateKey = secp.utils.hashToPrivateKey(derivedKey)
  const publicKey = secp.getPublicKey(privateKey, true)
  return { privateKey, publicKey }
}

export function getWalletAddressFromPrivateKey(privateKey: Uint8Array) {
  return privateKeyToAccount(fromBytes(privateKey, 'hex')).address.toLowerCase()
}

/**
 * Encrypts a passphrase using AES-256-GCM encryption with a key derived from two key shares.
 *
 * @param {string} keyshare1 - The first keyshare used to derive the encryption key.
 * @param {string} keyshare2 - The second keyshare used to derive the encryption key.
 * @param {string} passphrase - The passphrase to encrypt.
 * @returns {string} The encrypted passphrase, formatted as `nonce:encrypted:authTag`, all parts base64 encoded.
 */
export function encryptPassphrase(
  keyshare1: Buffer,
  keyshare2: Buffer,
  passphrase: string
): string {
  const derivedKey = deriveKeyFromKeyShares(keyshare1, keyshare2)
  const nonce = crypto.randomBytes(12) // GCM recommends a 12-byte nonce
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, nonce)

  let encrypted = cipher.update(passphrase, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return `${nonce.toString('base64')}:${encrypted}:${authTag.toString('base64')}`
}

/**
 * Decrypts an encrypted passphrase using AES-256-GCM decryption with a key derived from two key shares.
 *
 * @param {string} keyshare1 - The first keyshare used to derive the decryption key.
 * @param {string} keyshare2 - The second keyshare used to derive the decryption key.
 * @param {string} encryptedData - The data to decrypt, formatted as `nonce:encrypted:authTag`, all parts base64 encoded.
 * @returns {string} The decrypted passphrase.
 */
export function decryptPassphrase(
  keyshare1: Buffer,
  keyshare2: Buffer,
  encryptedData: string
): string {
  const derivedKey = deriveKeyFromKeyShares(keyshare1, keyshare2)
  const [nonceBase64, encrypted, authTagBase64] = encryptedData.split(':')
  const nonce = Buffer.from(nonceBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, nonce)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
