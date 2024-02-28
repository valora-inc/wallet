import * as secp from '@noble/secp256k1'
import { fromBytes, fromHex } from 'viem'
import {
  decryptPassphrase,
  deriveKeyFromKeyShares,
  encryptPassphrase,
  getSecp256K1KeyPair,
  getWalletAddressFromPrivateKey,
} from './encryption'

describe("Encryption utilities using Node's crypto and futoin-hkdf", () => {
  let keyshare1: Buffer
  let keyshare2: Buffer
  let passphrase: string

  beforeEach(() => {
    keyshare1 = Buffer.from('57e25df276a72a7f38c862803a201596', 'hex')
    keyshare2 = Buffer.from('bc56bf47e65f62319a0659bfe106e992', 'hex')
    passphrase =
      'hurdle citizen woman cherry wedding screen camp pony curve bargain pipe trend clump absent mule uncover where obey other tent december betray space jacket'
  })

  describe('deriveKeyFromKeyShares', () => {
    it('should derive a buffer of length 32 by default', () => {
      const buffer = deriveKeyFromKeyShares(keyshare1, keyshare2)
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBe(32)
    })

    it('should derive a buffer of length 48 when specified', () => {
      const buffer = deriveKeyFromKeyShares(keyshare1, keyshare2, 48)
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBe(48)
    })

    it('gives same result when called twice with same inputs', () => {
      const buffer1 = deriveKeyFromKeyShares(keyshare1, keyshare2)
      const buffer2 = deriveKeyFromKeyShares(keyshare1, keyshare2)
      expect(buffer1).toEqual(buffer2)
    })

    it('should produce different outputs for different keyshares', () => {
      const buffer1 = deriveKeyFromKeyShares(keyshare1, keyshare2)
      const buffer2 = deriveKeyFromKeyShares(keyshare2, keyshare1)
      expect(buffer1.toString('hex')).not.toBe(buffer2.toString('hex'))
    })
    it('should throw if a keyshare is less than 16 bytes', () => {
      const shortKeyshare = Buffer.from('77020c157b3440de1b697ab0e66baf', 'hex') // obtained with crypto.randomBytes(15).toString('hex')
      expect(() => deriveKeyFromKeyShares(keyshare1, shortKeyshare)).toThrow()
      expect(() => deriveKeyFromKeyShares(shortKeyshare, keyshare2)).toThrow()
    })
  })

  describe('getSecp256K1KeyPair', () => {
    it('should produce a valid secp256k1 key pair', async () => {
      const { privateKey, publicKey } = getSecp256K1KeyPair(keyshare1, keyshare2)
      expect(fromHex(privateKey, 'bytes').byteLength).toEqual(32)
      expect(fromHex(publicKey, 'bytes').byteLength).toEqual(33)

      // able to sign with private key and verify with public key
      const messageHash = await secp.utils.sha256(new TextEncoder().encode('hello world'))
      const signature = await secp.sign(messageHash, fromHex(privateKey, 'bytes'))
      expect(secp.verify(signature, messageHash, fromHex(publicKey, 'bytes'))).toBe(true)
    })

    it('gives same result when called twice with same inputs', async () => {
      const { privateKey, publicKey } = getSecp256K1KeyPair(keyshare1, keyshare2)
      const { privateKey: privateKey2, publicKey: publicKey2 } = getSecp256K1KeyPair(
        keyshare1,
        keyshare2
      )
      expect(privateKey).toEqual(privateKey2)
      expect(publicKey).toEqual(publicKey2)
    })
  })

  describe('encryptPassphrase', () => {
    it('should encrypt a passphrase using two keyshares', () => {
      const encrypted = encryptPassphrase(keyshare1, keyshare2, passphrase)
      expect(encrypted).toBeTruthy()
      expect(typeof encrypted).toBe('string')
    })
  })

  describe('decryptPassphrase', () => {
    it('should decrypt an encrypted passphrase correctly', () => {
      const encrypted = encryptPassphrase(keyshare1, keyshare2, passphrase)
      const decrypted = decryptPassphrase(keyshare1, keyshare2, encrypted)
      expect(decrypted).toBe(passphrase)
    })
    it('should be deterministic', () => {
      const encrypted = encryptPassphrase(keyshare1, keyshare2, passphrase)
      const decrypted1 = decryptPassphrase(keyshare1, keyshare2, encrypted)
      const decrypted2 = decryptPassphrase(keyshare1, keyshare2, encrypted)
      expect(decrypted1).toBe(decrypted2)
    })
    it('throws if authTag is tampered with', () => {
      // fails if decipher.final() is not called
      const encrypted = encryptPassphrase(keyshare1, keyshare2, passphrase)
      const [nonceBase64, encryptedMessage, authTagBase64] = encrypted.split(':')
      const tamperedFirstChar = authTagBase64[0] === 'A' ? 'B' : 'A'
      const tampered = `${nonceBase64}:${encryptedMessage}:${tamperedFirstChar}${authTagBase64.slice(
        1
      )}`
      expect(() => decryptPassphrase(keyshare1, keyshare2, tampered)).toThrow()
    })
    it('throws if authTag from other passphrase is used', () => {
      const encrypted0 = encryptPassphrase(keyshare1, keyshare2, passphrase)
      const encrypted1 = encryptPassphrase(keyshare1, keyshare2, 'passphrase one')
      const [nonce0, encryptedMessage0, _authTag0] = encrypted0.split(':')
      const [_nonce1, _encryptedMessage1, authTag1] = encrypted1.split(':')
      const tampered = `${nonce0}:${encryptedMessage0}:${authTag1}`
      expect(() => decryptPassphrase(keyshare1, keyshare2, tampered)).toThrow()
    })
  })

  describe('getWalletAddressFromPrivateKey', () => {
    it('gives lowercase wallet address associated with private key', () => {
      expect(
        getWalletAddressFromPrivateKey(
          fromBytes(
            Buffer.from('0da7744e59ab530ebaa3ca5c6e67170fd18276fb1e093ba2eaa48f1d5756ffcb', 'hex'),
            'hex'
          )
        )
      ).toBe('0xbdde6c4f63a50b23c8bd8409fe4d9cfb33c619de')
    })
  })
})
