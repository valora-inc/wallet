import { normalizeAddress } from '@celo/utils/lib/address'
import MockDate from 'mockdate'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { KeychainLock, clearStoredAccounts, listStoredAccounts } from 'src/web3/KeychainLock'
import * as mockedKeychain from 'test/mockedKeychain'
import { privateKeyToAddress } from 'viem/accounts'

// Use real encryption
jest.unmock('crypto-js')

const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const KEYCHAIN_ENCRYPTED_PRIVATE_KEY1 =
  'U2FsdGVkX1+4Da/3VE98t6m9FNs+Q0fqJlckHnL2+XctJPyvhZY+b0TSAB9oGiAMNDow1bjA3NYyzA3aKhFhHwAySzPOArFI/RpPlArT2/IGZ/IxKtKzKnd1pa4+q4fx'
const ACCOUNT_ADDRESS1 = privateKeyToAddress(PRIVATE_KEY1).toLowerCase()
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const KEYCHAIN_ENCRYPTED_PRIVATE_KEY2 =
  'U2FsdGVkX18191f7q1dS0CCvSGNjJ9PkcBGKaf+u1LVpuoBw2xSJe17hLW8QRXyKCtwvMknW2uTeWUeMRSfg/O1UdsEwdhMPxzqtOUTwT9evQri80JMGBImihFXKDdgN'
const ACCOUNT_ADDRESS2 = privateKeyToAddress(PRIVATE_KEY2).toLowerCase()

const MOCK_DATE = new Date('2016-12-21T23:36:07.071Z')

beforeEach(() => {
  jest.clearAllMocks()
  mockedKeychain.clearAllItems()
})

afterEach(() => {
  MockDate.reset()
})

describe(listStoredAccounts, () => {
  it('lists all addresses sorted by creation date', async () => {
    // Setup mocked keychain content, intentionally ordering items in descending creation date
    // created using:
    // await lock.addAccount(PRIVATE_KEY1, 'password')
    // await lock.addAccount(PRIVATE_KEY2, 'password2')
    mockedKeychain.setItems({
      'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
        password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY2,
      },
      // This will be ignored
      'unrelated item': {
        password: 'unrelated password',
      },
      'account--2021-01-10T11:14:50.298Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb': {
        password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
      },
    })

    expect(await listStoredAccounts()).toEqual([
      {
        address: ACCOUNT_ADDRESS1,
        createdAt: new Date('2021-01-10T11:14:50.298Z'),
      },
      {
        address: ACCOUNT_ADDRESS2,
        createdAt: new Date('2022-05-25T11:14:50.292Z'),
      },
    ])
  })
})

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
  })

  const mockAddress = ACCOUNT_ADDRESS1
  const mockAddressInUpperCase = `0x${ACCOUNT_ADDRESS1.substring(2).toUpperCase()}`
  const mockAddressInLowerCase = ACCOUNT_ADDRESS1.toLowerCase()

  describe('addAccount', () => {
    beforeEach(() => {
      MockDate.set(MOCK_DATE)
    })

    it('adds a new account', async () => {
      const account = await lock.addAccount(PRIVATE_KEY1, 'password')

      expect(account).toEqual({
        address: ACCOUNT_ADDRESS1,
        createdAt: MOCK_DATE,
      })
      expect(mockedKeychain.getAllKeys()).toEqual([
        `account--2016-12-21T23:36:07.071Z--${ACCOUNT_ADDRESS1.substring(2)}`,
      ])
    })
    it('succeeds with a private key without 0x', async () => {
      const account = await lock.addAccount(PRIVATE_KEY1.substring(2), 'password')
      expect(account).toEqual({
        address: ACCOUNT_ADDRESS1,
        createdAt: MOCK_DATE,
      })
      expect(mockedKeychain.getAllKeys()).toEqual([
        `account--2016-12-21T23:36:07.071Z--${ACCOUNT_ADDRESS1.substring(2)}`,
      ])
    })
    it('fails with an invalid private key', async () => {
      await expect(
        lock.addAccount('this is not a valid private key', 'password')
      ).rejects.toThrowError('private key must be 32 bytes, hex or bigint, not string')
    })
    it('fails if the account already exists', async () => {
      await lock.addAccount(PRIVATE_KEY1, 'password')
      await expect(lock.addAccount(PRIVATE_KEY1, 'password')).rejects.toThrowError(
        ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS
      )
    })
  })

  describe('isUnlocked', () => {
    it('returns false if the account has not been added', () => {
      expect(lock.isUnlocked(mockAddress)).toBe(false)
    })
    it('returns false if the account has been added but not unlocked', async () => {
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
      expect(lock.isUnlocked(mockAddress)).toBe(false)
    })
    it('returns false if the account has been added and unlocked but the duration has passed', async () => {
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
      await lock.unlock(mockAddress, 'password', -1) // spoofing duration passed by using a negative duration
      expect(lock.isUnlocked(mockAddress)).toBe(false)
    })
    it('returns true if the account has been added and unlocked and the duration has not passed', async () => {
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
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
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
      // now remove from keychain
      mockedKeychain.clearAllItems()
      await expect(lock.unlock(mockAddress, 'password', 100)).rejects.toThrow()
    })
    it('returns true if account is unlocked with all uppercase address', async () => {
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
      expect(await lock.unlock(mockAddressInUpperCase, 'password', 100)).toBe(true)
    })
    it('unlocks the viem account', async () => {
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
      const viemAccount = lock.getViemAccount(mockAddress)
      await expect(viemAccount?.signMessage({ message: 'flarf' })).rejects.toThrowError(
        'authentication needed: password or unlock'
      )
      expect(lock.isUnlocked(mockAddress)).toBe(false)
      expect(await lock.unlock(mockAddress, 'password', 100)).toBe(true)
      expect(lock.isUnlocked(mockAddress)).toBe(true)
      expect(await viemAccount?.signMessage({ message: 'flarf' })).toEqual(expect.any(String))
    })
  })

  describe('updatePassphrase', () => {
    it('returns false if the account has not been added', async () => {
      expect(await lock.updatePassphrase(mockAddress, 'password', 'new-password')).toBe(false)
    })

    it('throws if the account has been added but private key is not in the keychain', async () => {
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
      // now remove from keychain
      mockedKeychain.clearAllItems()
      await expect(lock.updatePassphrase(mockAddress, 'password', 'new-password')).rejects.toThrow()
    })

    it('returns true if the account and key is present and address is passed in different case', async () => {
      mockedKeychain.setItems({
        [`account--${date.toISOString()}--${normalizeAddress(mockAddress)}`]: {
          password: KEYCHAIN_ENCRYPTED_PRIVATE_KEY1,
        },
      })
      await lock.loadExistingAccounts()
      expect(await lock.updatePassphrase(mockAddressInUpperCase, 'password', 'new-password')).toBe(
        true
      )
    })
  })
})
