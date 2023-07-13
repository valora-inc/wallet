import MockDate from 'mockdate'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'
import * as mockedKeychain from 'test/mockedKeychain'
import { normalizeAddressWith0x } from '@celo/utils/lib/address'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { UNLOCK_DURATION } from 'src/web3/consts'

// Use real encryption
jest.unmock('crypto-js')

const MOCK_DATE = new Date(1482363367071)
const privateKey = '267e0c426906325af2b3811c83e9e9b92a4c5ccf4cc6a83006a0f77c6a8dddfc'

describe('KeychainAccountManager', () => {
  let keychainAccountManager: KeychainAccountManager

  beforeEach(() => {
    jest.clearAllMocks()
    mockedKeychain.clearAllItems()
    keychainAccountManager = new KeychainAccountManager()
  })
  afterEach(() => {
    MockDate.reset()
  })

  describe('init/loadAccounts', () => {
    it('loads an account already in the keychain', async () => {
      MockDate.set(MOCK_DATE)
      // Add account to the keychain
      const address = await keychainAccountManager.addAccount(privateKey, 'password')
      // Load it into a new keychain account manager
      const newKeychainAccountManager = new KeychainAccountManager()
      const accounts = await newKeychainAccountManager.loadAccounts({
        address,
        createdAt: MOCK_DATE,
      })
      expect(accounts).toHaveLength(1)
      expect(accounts[0]).toEqual({
        address,
        createdAt: MOCK_DATE,
      })
    })
  })
  describe('addAccount', () => {
    it('adds an account and calls callbacks', async () => {
      MockDate.set(MOCK_DATE)
      const callbackFn = jest.fn()
      keychainAccountManager.registerAddAccountCallback(callbackFn)
      const address = await keychainAccountManager.addAccount(privateKey, 'password')
      expect(keychainAccountManager.hasAccount(address)).toBe(true)
      expect(callbackFn).toHaveBeenCalledTimes(1)
      expect(callbackFn).toHaveBeenCalledWith(normalizeAddressWith0x(privateKey), address, {
        address,
        createdAt: MOCK_DATE,
      })
    })
    it('fails to add account if already exists', async () => {
      const address = await keychainAccountManager.addAccount(privateKey, 'password')
      expect(keychainAccountManager.hasAccount(address)).toBe(true)
      await expect(keychainAccountManager.addAccount(privateKey, 'password')).rejects.toEqual(
        new Error(ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS)
      )
    })
  })
  describe('updateAccount', () => {
    it('updates password successfully', async () => {
      const address = await keychainAccountManager.addAccount(privateKey, 'password')
      await expect(
        keychainAccountManager.updateAccount(address, 'password', 'newPassword')
      ).resolves.toBe(true)
      // Cannot unlock with old password
      await expect(
        keychainAccountManager.unlockAccount(address, 'password', UNLOCK_DURATION)
      ).resolves.toBe(undefined)
      expect(keychainAccountManager.isAccountUnlocked(address)).toBe(false)
      // Can unlock with new password
      await expect(
        keychainAccountManager.unlockAccount(address, 'newPassword', UNLOCK_DURATION)
      ).resolves.toBe(normalizeAddressWith0x(privateKey))
      expect(keychainAccountManager.isAccountUnlocked(address)).toBe(true)
    })
    it('fails to update password when incorrect', async () => {
      const address = await keychainAccountManager.addAccount(privateKey, 'password')
      await expect(
        keychainAccountManager.updateAccount(address, 'wrong password', 'newPassword')
      ).resolves.toBe(false)
      // Cannot unlock with new password
      await expect(
        keychainAccountManager.unlockAccount(address, 'newPassword', UNLOCK_DURATION)
      ).resolves.toBe(undefined)
      expect(keychainAccountManager.isAccountUnlocked(address)).toBe(false)
      // Can unlock with old password
      await expect(
        keychainAccountManager.unlockAccount(address, 'password', UNLOCK_DURATION)
      ).resolves.toBe(normalizeAddressWith0x(privateKey))
      expect(keychainAccountManager.isAccountUnlocked(address)).toBe(true)
    })
  })
})
