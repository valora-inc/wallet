import crypto from 'crypto'
import {
  decryptPassphrase,
  deriveKeyFromKeyShares,
  encryptPassphrase,
  getSecp256K1KeyPair,
} from './encryption'

describe("Encryption utilities using Node's crypto and futoin-hkdf", () => {
  let keyshare1: Buffer
  let keyshare2: Buffer
  let passphrase: string

  beforeEach(() => {
    keyshare1 = crypto.randomBytes(16)
    keyshare2 = crypto.randomBytes(16)
    passphrase = 'testPassphrase'
  })

  describe('deriveKeyFromKeyShares', () => {
    it('should derive a buffer of length 32', () => {
      const buffer = deriveKeyFromKeyShares(keyshare1, keyshare2)
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBe(32)
    })

    it('should produce different outputs for different keyshares', () => {
      const buffer1 = deriveKeyFromKeyShares(keyshare1, keyshare2)
      const buffer2 = deriveKeyFromKeyShares(keyshare2, keyshare1)
      expect(buffer1.toString('hex')).not.toBe(buffer2.toString('hex'))
    })
    it('should throw if a keyshare is less than 16 bytes', () => {
      expect(() => deriveKeyFromKeyShares(keyshare1, crypto.randomBytes(15))).toThrow()
    })
  })

  describe('getSecp256K1KeyPair', () => {
    it('should produce a valid secp256k1 private key', () => {
      const privateKey = getSecp256K1KeyPair(keyshare1, keyshare2)
      expect(privateKey).toBeInstanceOf(Uint8Array)
      expect(privateKey.byteLength).toEqual(32)
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
  })
})
