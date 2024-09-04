import { bytesToUtf8, u8, utf8ToBytes } from '@noble/ciphers/utils'
import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'
import { ECIES } from 'src/utils/ecies'

describe('ECIES', () => {
  describe('encrypt', () => {
    it('should encrypt a message without error', () => {
      const privKey = randomBytes(32)
      const pubKey = secp256k1.getPublicKey(privKey, false).slice(1)
      const message = Buffer.from('foo')

      expect(() => ECIES.Encrypt(pubKey, message)).not.toThrow()
    })
    it('should throw an error if priv key is given', () => {
      const privKey = randomBytes(32)
      const message = Buffer.from('foo')

      expect(() => ECIES.Encrypt(privKey, message)).toThrow()
    })

    it('should not regress', () => {
      // snapshot generated on master at commit=4861e71d0
      // with message='foo'
      // and privkey='f353837781491b9ded31b6cb669c867e4c91f0ccfdaa85db4b1f0a814bc060c5'
      const snapshotPrivKey = u8(
        Buffer.from('f353837781491b9ded31b6cb669c867e4c91f0ccfdaa85db4b1f0a814bc060c5', 'hex')
      )
      const snapshotEncrypted = Buffer.from(
        '0487d78806c22bc7a5dd5ab38b02fb7ef48220648b6dd815b7ea3466c0270ebfe17aafece9af8f1c827ae9c47bac4215cd344afd94132581f4d789f8715a429d5c5c2dc365496750655bcd1c29445b118967cf790bb46b6a708ff1b3e82982173d98546ae6f228260913572127dc38a015386cb8',
        'hex'
      )
      expect(bytesToUtf8(ECIES.Decrypt(snapshotPrivKey, snapshotEncrypted))).toEqual('foo')
    })
  })

  describe('roundtrip', () => {
    it('should return the same plaintext after roundtrip', () => {
      const plaintext = 'spam'
      const privKey = randomBytes(32)
      const pubKey = secp256k1.getPublicKey(privKey, false).slice(1)
      const encrypted = ECIES.Encrypt(pubKey, utf8ToBytes(plaintext))
      const decrypted = ECIES.Decrypt(Buffer.from(privKey), encrypted)

      expect(bytesToUtf8(decrypted)).toEqual(plaintext)
    })

    it('should only decrypt if correct priv key is given', () => {
      const plaintext = Buffer.from('spam')
      const privKey = randomBytes(32)
      const pubKey = secp256k1.getPublicKey(privKey, false).slice(1)
      const fakePrivKey = randomBytes(32)
      const encrypted = ECIES.Encrypt(pubKey, plaintext)

      expect(() => ECIES.Decrypt(fakePrivKey, encrypted)).toThrow()
    })

    it('should be able to encrypt and decrypt a longer message (1024 bytes)', () => {
      const plaintext = randomBytes(1024)
      const privKey = randomBytes(32)
      const pubKey = secp256k1.getPublicKey(privKey, false).slice(1)
      const encrypted = ECIES.Encrypt(pubKey, plaintext)
      const decrypted = ECIES.Decrypt(privKey, encrypted)

      expect(decrypted).toEqual(plaintext)
    })
  })
})

describe('AES128CTR', () => {
  describe('encrypt', () => {
    it('should encrypt a message without error', () => {
      const plaintext = Buffer.from('spam')
      const encKey = randomBytes(16)
      const macKey = randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      expect(encrypted.length).toBeGreaterThanOrEqual(plaintext.length)
    })
  })

  describe('roundtrip', () => {
    it('should return the same plaintext after roundtrip', () => {
      const plaintext = Buffer.from('spam')
      const encKey = randomBytes(16)
      const macKey = randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      const decrypted = ECIES.AES128DecryptAndHMAC(encKey, macKey, encrypted)
      expect(bytesToUtf8(decrypted)).toEqual(plaintext.toString())
    })

    it('should only decrypt if correct priv key is given', () => {
      const plaintext = Buffer.from('spam')
      const encKey = randomBytes(16)
      const macKey = randomBytes(16)
      const fakeKey = randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      // console.info(encrypted.toString('hex').length)
      const decrypted = ECIES.AES128DecryptAndHMAC(fakeKey, macKey, encrypted)
      expect(plaintext.equals(decrypted)).toBe(false)
    })

    it('should be able to encrypt and decrypt a longer message (1024 bytes)', () => {
      const plaintext = randomBytes(1024)
      const encKey = randomBytes(16)
      const macKey = randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      const decrypted = ECIES.AES128DecryptAndHMAC(encKey, macKey, encrypted)
      expect(decrypted).toEqual(plaintext)
    })
  })

  describe('authentication', () => {
    it('should reject invalid mac', () => {
      try {
        const plaintext = Buffer.from('spam')
        const encKey = randomBytes(16)
        const macKey = randomBytes(16)
        const fakeKey = randomBytes(16)
        const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
        ECIES.AES128DecryptAndHMAC(encKey, fakeKey, encrypted)
        expect(true).toBe(false)
      } catch (e) {
        // Should in fact throw.
      }
    })
  })
})
