import ValoraEthersWallet from 'src/ethers/ValoraEthersWallet'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'
import { Chain } from 'src/ethers/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { UNLOCK_DURATION } from 'src/web3/consts'

// Use real encryption
jest.unmock('crypto-js')

const privateKey = '267e0c426906325af2b3811c83e9e9b92a4c5ccf4cc6a83006a0f77c6a8dddfc'

describe('ValoraEthersWallet', () => {
  let wallet: ValoraEthersWallet
  let keychainAccountManager: KeychainAccountManager

  beforeEach(() => {
    keychainAccountManager = new KeychainAccountManager()
    wallet = new ValoraEthersWallet(Chain.Celo, keychainAccountManager)
  })

  describe('hasAccount', () => {
    it('returns false when no account found', () => {
      expect(wallet.hasAccount('fake-address')).toBe(false)
    })
    it('returns false when address undefined', () => {
      expect(wallet.hasAccount(undefined)).toBe(false)
    })
    it('returns true when account found', async () => {
      const address = await wallet.addAccount(privateKey, 'password')
      expect(wallet.hasAccount(address)).toBe(true)
    })
  })
  describe('getAccounts', () => {
    it('returns accounts', async () => {
      const addressOne = await wallet.addAccount(privateKey, 'password')
      const privateKeyTwo = '267e0c426906325af2b3811c83e9e9b92a4c5ccf4cc6a83006a0f77c6a8dddf2'
      const addressTwo = await wallet.addAccount(privateKeyTwo, 'password')
      const accounts = wallet.getAccounts()
      expect(accounts).toHaveLength(2)
      expect(accounts).toContain(addressOne)
      expect(accounts).toContain(addressTwo)
    })
  })
  describe('addAccount', () => {
    it('throws when account already registered', async () => {
      await wallet.addAccount(privateKey, 'password')
      await expect(wallet.addAccount(privateKey, 'password')).rejects.toEqual(
        new Error(ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS)
      )
    })
    it('adds an account', async () => {
      const address = await wallet.addAccount(privateKey, 'password')
      expect(wallet.hasAccount(address)).toBe(true)
    })
    it('adds an account and triggers callback on separate wallet', async () => {
      const walletTwo = new ValoraEthersWallet(Chain.Celo, keychainAccountManager)
      const address = await wallet.addAccount(privateKey, 'password')
      const walletOneAccounts = wallet.getAccounts()
      const walletTwoAccounts = walletTwo.getAccounts()
      expect(walletOneAccounts).toHaveLength(1)
      expect(walletOneAccounts).toContain(address)
      expect(walletTwoAccounts).toHaveLength(1)
      expect(walletTwoAccounts).toContain(address)
    })
  })
  describe('unlockAccount', () => {
    it('returns false on failure', async () => {
      const address = await wallet.addAccount(privateKey, 'password')
      await expect(wallet.unlockAccount(address, 'wrong password', UNLOCK_DURATION)).resolves.toBe(
        false
      )
      expect(wallet.isAccountUnlocked(address)).toBe(false)
    })
    it('returns true on success', async () => {
      const address = await wallet.addAccount(privateKey, 'password')
      await expect(wallet.unlockAccount(address, 'password', UNLOCK_DURATION)).resolves.toBe(true)
      expect(wallet.isAccountUnlocked(address)).toBe(true)
    })
  })
  describe('updateAccount', () => {
    it('updates account passphrase', async () => {
      const address = await wallet.addAccount(privateKey, 'password')
      await expect(wallet.updateAccount(address, 'password', 'newPassword')).resolves.toBe(true)
      await expect(wallet.unlockAccount(address, 'password', UNLOCK_DURATION)).resolves.toBe(false)
      await expect(wallet.unlockAccount(address, 'newPassword', UNLOCK_DURATION)).resolves.toBe(
        true
      )
    })
    it('throws if old passphrase incorrect', async () => {
      const address = await wallet.addAccount(privateKey, 'password')
      await expect(wallet.updateAccount(address, 'wrong password', 'newPassword')).resolves.toBe(
        false
      )
      await expect(wallet.unlockAccount(address, 'password', UNLOCK_DURATION)).resolves.toBe(true)
      await expect(wallet.unlockAccount(address, 'newPassword', UNLOCK_DURATION)).resolves.toBe(
        false
      )
    })
  })
})
