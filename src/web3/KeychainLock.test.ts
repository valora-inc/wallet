import { normalizeAddress } from '@celo/utils/lib/address'
import { KeychainLock, clearStoredAccounts } from 'src/web3/KeychainLock'
import * as mockedKeychain from 'test/mockedKeychain'
import { mockAccount } from 'test/values'

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
  it('isUnlocked returns false if the account has not been added', () => {
    expect(lock.isUnlocked(mockAccount)).toBe(false)
  })
  it('isUnlocked returns false if the account has been added but not unlocked', () => {
    lock.addAccount({ address: mockAccount, createdAt: date })
    expect(lock.isUnlocked(mockAccount)).toBe(false)
  })
  it('isUnlocked returns false if the account has been added and unlocked but the duration has passed', async () => {
    lock.addAccount({ address: mockAccount, createdAt: date })
    mockedKeychain.setItems({
      [`account--${date.toISOString()}--${normalizeAddress(mockAccount)}`]: {
        password: 'password',
      },
    })
    await lock.unlock(mockAccount, 'password', -1) // spoofing duration passed by using a negative duration
    expect(lock.isUnlocked(mockAccount)).toBe(false)
  })
  it('isUnlocked returns true if the account has been added and unlocked and the duration has not passed', async () => {
    lock.addAccount({ address: mockAccount, createdAt: date })
    mockedKeychain.setItems({
      [`account--${date.toISOString()}--${normalizeAddress(mockAccount)}`]: {
        password: 'password',
      },
    })
    await lock.unlock(mockAccount, 'password', 100)
    expect(lock.isUnlocked(mockAccount)).toBe(true)
  })
  it('unlock returns false if the account has not been added', async () => {
    expect(await lock.unlock(mockAccount, 'password', 100)).toBe(false)
  })
  it('unlock throws if has been added but private key is not in the keychain', async () => {
    lock.addAccount({ address: mockAccount, createdAt: date })
    await expect(async () => await lock.unlock(mockAccount, 'password', 100)).rejects.toThrow()
  })
})
