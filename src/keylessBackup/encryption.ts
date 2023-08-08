import crypto from 'crypto'
import { ec as EC } from 'elliptic'
import hkdf from 'futoin-hkdf'

const ec = new EC('secp256k1')

/**
 * Derives a 256-bit key using the HKDF method from two key shares.
 *
 * @param {string} keyshare1 - The first keyshare in utf8 format.
 * @param {string} keyshare2 - The second keyshare in utf8 format.
 * @returns {Buffer} A derived 256-bit key as a Buffer.
 */
export function deriveKeyFromKeyShares(keyshare1: string, keyshare2: string): Buffer {
  // Combining the keyshares
  const combinedKeyShares = Buffer.concat([
    Buffer.from(keyshare1, 'utf8'),
    Buffer.from(keyshare2, 'utf8'),
  ])

  // Using futoin-hkdf to derive a 256-bit key
  return hkdf(combinedKeyShares, 32, {
    salt: 'some fixed salt',
    info: 'encryption',
    hash: 'SHA-256',
  })
}

/**
 * Derives a 256-bit key using the HKDF method from two key shares then derives a secp256k1 pair from that.
 *
 * @param {string} keyshare1 - The first keyshare in utf8 format.
 * @param {string} keyshare2 - The second keyshare in utf8 format.
 * @returns {Buffer} A derived 256-bit key as a Buffer.
 */
export function getSecp256K1KeyPair(keyshare1: string, keyshare2: string): EC.KeyPair {
  const derivedKey = deriveKeyFromKeyShares(keyshare1, keyshare2)

  return ec.keyFromPrivate(derivedKey)
}

/**
 * Encrypts a passphrase using AES-256-GCM encryption with a key derived from two key shares.
 *
 * @param {string} keyshare1 - The first keyshare used to derive the encryption key.
 * @param {string} keyshare2 - The second keyshare used to derive the encryption key.
 * @param {string} passphrase - The passphrase to encrypt.
 * @returns {string} The encrypted passphrase, formatted as `iv:encrypted:authTag`, all parts base64 encoded.
 */
export function encryptPassphrase(
  keyshare1: string,
  keyshare2: string,
  passphrase: string
): string {
  const derivedKey = deriveKeyFromKeyShares(keyshare1, keyshare2)
  const iv = crypto.randomBytes(12) // GCM recommends a 12-byte IV
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv)

  let encrypted = cipher.update(passphrase, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`
}

/**
 * Decrypts an encrypted passphrase using AES-256-GCM decryption with a key derived from two key shares.
 *
 * @
 * @param {string} keyshare1 - The first keyshare used to derive the decryption key.
 * @param {string} keyshare2 - The second keyshare used to derive the decryption key.
 * @param {string} encryptedData - The data to decrypt, formatted as `iv:encrypted:authTag`, all parts base64 encoded.
 * @returns {string} The decrypted passphrase.
 */
export function decryptPassphrase(
  keyshare1: string,
  keyshare2: string,
  encryptedData: string
): string {
  const derivedKey = deriveKeyFromKeyShares(keyshare1, keyshare2)
  const [ivBase64, encrypted, authTagBase64] = encryptedData.split(':')
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
