import { normalizeAddress } from '@celo/utils/lib/address'
import { KeychainLock, clearStoredAccounts } from 'src/web3/KeychainLock'
import * as mockedKeychain from 'test/mockedKeychain'
import { mockAccount2 } from 'test/values'

describe(clearStoredAccounts, () => {
  it('only clears the stored accounts', async () => {
    mockedKeychain.setItems({
      'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
        password: 'encrypted password',
      },
      'unrelated item': {
        password: 'unrelated password',
      },
      'account--2021-01-10T11:14:50.298Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb': {
        password: 'encrypted password2',
      },
    })

    await expect(clearStoredAccounts()).resolves.toBe(undefined)

    expect(mockedKeychain.getAllKeys()).toEqual(['unrelated item'])
  })
})

describe('KeychainLock', () => {
  let lock: KeychainLock
  let date: Date
  beforeEach(() => {
    lock = new KeychainLock()
    date = new Date()
    mockedKeychain.clearAllItems()
  })

  const mockAddress = mockAccount2
  const mockAddressInUpperCase = `0x${mockAccount2.substring(2).toUpperCase()}`
  const mockAddressInLowerCase = mockAccount2.toLowerCase()

  describe('isUnlocked', () => {
    it('returns false if the account has not been added', () => {
      expect(lock.isUnlocked(mockAddress)).toBe(false)
    })
    it('returns false if the account has been added but not unlocked', () => {
      lock.addAccount({ address: mockAddress, createdAt: date })
      expect(lock.isUnlocked(mockAddress)).toBe(false)
    })
    it('returns false if the account has been added and unlocked but the duration has passed', async () => {
      lock.addAccount({ address: mockAddress, createdAt: date })
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: 'password',
        },
      })
      await lock.unlock(mockAddress, 'password', -1) // spoofing duration passed by using a negative duration
      expect(lock.isUnlocked(mockAddress)).toBe(false)
    })
    it('returns true if the account has been added and unlocked and the duration has not passed', async () => {
      lock.addAccount({ address: mockAddress, createdAt: date })
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: 'password',
        },
      })
      await lock.unlock(mockAddress, 'password', 100)
      expect(lock.isUnlocked(mockAddress)).toBe(true)
      // check for different casing
      expect(lock.isUnlocked(mockAddressInLowerCase)).toBe(true)
      expect(lock.isUnlocked(mockAddressInUpperCase)).toBe(true)
    })
  })

  describe('unlock', () => {
    it('returns false if the account has not been added', async () => {
      expect(await lock.unlock(mockAddress, 'password', 100)).toBe(false)
    })
    it('throws if the account has been added but private key is not in the keychain', async () => {
      lock.addAccount({ address: mockAddress, createdAt: date })
      await expect(lock.unlock(mockAddress, 'password', 100)).rejects.toThrow()
    })
    it('returns true if account is unlocked with all uppercase address', async () => {
      lock.addAccount({ address: mockAddress, createdAt: date })
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: 'password',
        },
      })
      expect(await lock.unlock(mockAddressInUpperCase, 'password', 100)).toBe(true)
    })
  })

  describe('updatePassphrase', () => {
    it('returns false if the account has not been added', async () => {
      expect(await lock.updatePassphrase(mockAddress, 'password', 'new-password')).toBe(false)
    })

    it('throws if the account has been added but private key is not in the keychain', async () => {
      lock.addAccount({ address: mockAddress, createdAt: date })
      await expect(lock.updatePassphrase(mockAddress, 'password', 'new-password')).rejects.toThrow()
    })

    it('returns true if the account and key is present and address is passed in different case', async () => {
      lock.addAccount({ address: mockAddress, createdAt: date })
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: 'password',
        },
      })
      expect(await lock.updatePassphrase(mockAddressInUpperCase, 'password', 'new-password')).toBe(
        true
      )
    })
  })
})
