/**
 * Reference file:
 * https://github.com/celo-org/developer-tooling/blob/38b26316d615e836e21bbfe2f44853f7e8220e03/packages/sdk/utils/src/ecies.ts
 */

/**
 * ECIES encrypt/decrypt with Ethereum keys
 * A Typescript implementation of geth/crypto/ecies/ecies.go
 * Modified from https://github.com/LimelabsTech/eth-ecies/blob/master/index.js
 * At commit c858cbd021e9a99d8afa629de33c8c30d923b3e5.
 */
'use strict'

import { ctr } from '@noble/ciphers/aes'
import { u8 } from '@noble/ciphers/utils'
import { PrivKey } from '@noble/curves/abstract/utils'
import { PubKey } from '@noble/curves/abstract/weierstrass'
import { secp256k1 } from '@noble/curves/secp256k1'
import { hmac } from '@noble/hashes/hmac'
import { sha256 } from '@noble/hashes/sha256'
import { randomBytes } from '@noble/hashes/utils'

const IV_LENGTH = 16

/**
 * Increments big endian uint32
 *
 * @param {Buffer} ctr 32 bit unsigned big endian integer to increment.
 * @returns Incremented counter.
 */
const IncCounter = (ctr: Buffer) => {
  for (let i = ctr.length - 1; i >= 0; i--) {
    ctr[i]++
    if (ctr[i] !== 0) {
      return ctr
    }
  }
  return ctr
}

/**
 * NIST 8000-56C Rev 1 One Step KDF with the following parameters:
 * - H(x) is SHA-256(x)
 * - Fixed info is null
 *
 * TODO:
 * - Implement proper ceiling on reps.
 *
 * @param {Buffer} px Input keying material to derive key from.
 * @param {number} kdLen Length of output in bytes
 * @returns {Buffer} Output keying material of length kdLen bytes.
 */
const ConcatKDF = (px: Buffer, kdLen: number) => {
  const blockSize = 32
  const reps = ((kdLen + 7) * 8) / (blockSize * 8)
  let counter = Buffer.from('00000001', 'hex')
  let k = Buffer.from('00', 'hex')
  for (let i = 0; i <= reps; i++) {
    const hash = sha256.create()
    hash.update(counter)
    hash.update(px)
    k = Buffer.concat([k, hash.digest()])
    counter = IncCounter(counter)
  }
  return k.slice(1, kdLen + 1)
}

/**
 * AES-128 CTR encrypt
 * @param {Uint8Array} encryptionKey
 * @param {Uint8Array} iv
 * @param {Uint8Array} plaintext
 * @returns {Uint8Array} ciphertext
 */
function AES128Encrypt(
  encryptionKey: Uint8Array,
  iv: Uint8Array,
  plaintext: Uint8Array
): Uint8Array {
  const aes = ctr(encryptionKey, iv)
  const message = aes.encrypt(plaintext)
  return u8(Buffer.concat([iv, message]))
}

/**
 * AES-128 CTR encrypt with message authentication
 * @param {Uint8Array} encryptionKey
 * @param {Uint8Array} macKey
 *
 * @param {Uint8Array} plaintext
 * @returns {Uint8Array} ciphertext
 */
function AES128EncryptAndHMAC(
  encryptionKey: Uint8Array,
  macKey: Uint8Array,
  plaintext: Uint8Array
): Uint8Array {
  const iv = randomBytes(IV_LENGTH)
  const dataToMac = AES128Encrypt(encryptionKey, iv, plaintext)
  const mac = hmac(sha256, macKey, dataToMac)
  return u8(Buffer.concat([dataToMac, mac]))
}

/**
 * AES-128 CTR decrypt
 * @param {Uint8Array} encryptionKey
 * @param {Uint8Array} iv
 * @param {Uint8Array} ciphertext
 * @returns {Uint8Array} plaintext
 */
function AES128Decrypt(
  encryptionKey: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  const aes = ctr(encryptionKey, iv)
  return aes.decrypt(ciphertext)
}

/**
 * AES-128 CTR decrypt with message authentication
 * @param {Uint8Array} encryptionKey
 * @param {Uint8Array} macKey
 * @param {Uint8Array} ciphertext
 * @returns {Uint8Array} plaintext
 */
function AES128DecryptAndHMAC(
  encryptionKey: Uint8Array,
  macKey: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  const iv = ciphertext.slice(0, IV_LENGTH)
  const message = ciphertext.slice(IV_LENGTH, ciphertext.length - sha256.outputLen)
  const mac = ciphertext.slice(ciphertext.length - sha256.outputLen, ciphertext.length)
  const dataToMac = Buffer.concat([iv, message])
  const computedMac = hmac(sha256, macKey, dataToMac)
  if (!Buffer.from(mac).equals(Buffer.from(computedMac))) {
    throw new Error('MAC mismatch')
  }
  return AES128Decrypt(encryptionKey, iv, message)
}

const UNCOMPRESSED_KEY_LENGTH = 65
/**
 * ECIES encrypt
 * @param {Buffer} pubKeyTo Ethereum pub key, 64 bytes.
 * @param {Uint8Array} plaintext Plaintext to be encrypted.
 * @returns {Buffer} Encrypted message, serialized, 113+ bytes
 */
export function Encrypt(pubKeyTo: PubKey, plaintext: Uint8Array) {
  const ephemPrivKey = secp256k1.utils.randomPrivateKey()
  const ephemPubKey = Buffer.from(secp256k1.getPublicKey(ephemPrivKey, false))
  const ephemPubKeyEncoded = Buffer.from(ephemPubKey)
  if (typeof pubKeyTo === 'string') {
    pubKeyTo = secp256k1.ProjectivePoint.fromHex(pubKeyTo).toRawBytes()
  }

  const pubKeyToEncoded = Buffer.concat([Buffer.from([0x04]), pubKeyTo as unknown as Buffer])

  const px = secp256k1.getSharedSecret(ephemPrivKey, pubKeyToEncoded).slice(1)

  // NOTE:
  // Can't swap to proper hkdf implementation because then there's ALWAYS a mac mismatch
  // for OLD comments. Maybe we should use a comment version?
  //
  // const hash = hkdf(sha256, px, undefined, undefined, 32)
  const hash = ConcatKDF(Buffer.from(px), 32)
  const encryptionKey = hash.subarray(0, 16)
  const macKey = sha256.create().update(hash.subarray(16)).digest()
  const message = AES128EncryptAndHMAC(Buffer.from(encryptionKey), macKey, plaintext)
  const serializedCiphertext = Buffer.concat([
    ephemPubKeyEncoded, // {UNCOMPRESSED_KEY_LENGTH} bytes
    message, // iv + ciphertext + mac (min 48 bytes)
  ])

  return serializedCiphertext
}

/**
 * ECIES decrypt
 * @param {Buffer} privKey Ethereum private key, 32 bytes.
 * @param {Buffer} encrypted Encrypted message, serialized, 113+ bytes
 * @returns {Buffer} plaintext
 */
function Decrypt(privKey: PrivKey, encrypted: Buffer) {
  // Read iv, ephemPubKey, mac, ciphertext from encrypted message
  const ephemPubKeyEncoded = u8(encrypted).slice(0, UNCOMPRESSED_KEY_LENGTH)
  const symmetricEncrypted = u8(encrypted).slice(UNCOMPRESSED_KEY_LENGTH)

  const px = secp256k1.getSharedSecret(privKey, ephemPubKeyEncoded).slice(1)
  // NOTE:
  // Can't swap to proper hkdf implementation because then there's ALWAYS a mac mismatch
  // for OLD comments. Maybe we should use a comment version?
  //
  // const hash = hkdf(sha256, px, undefined, undefined, 32)
  const hash = ConcatKDF(Buffer.from(px), 32)
  // km, ke
  const encryptionKey = hash.subarray(0, 16)

  const macKey = sha256.create().update(hash.subarray(16)).digest()

  return AES128DecryptAndHMAC(Buffer.from(encryptionKey), macKey, symmetricEncrypted)
}

export const ECIES = {
  Encrypt,
  Decrypt,
  AES128EncryptAndHMAC,
  AES128DecryptAndHMAC,
}
