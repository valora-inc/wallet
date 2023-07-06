import {
  ImportMnemonicAccount,
  getStoredPrivateKey,
  listStoredAccounts,
  storePrivateKey,
} from 'src/web3/KeychainSigner'
import { KeychainAccount } from 'src/web3/types'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'

const TAG = 'web3/KeychainAccountManager'

interface UnlockData {
  // Timestamp in milliseconds when account was last unlocked
  unlockTime?: number
  // Number of seconds that the account was last unlocked for
  unlockDuration?: number
}

export type AddAccountCallbackFn = (
  normalizedPrivateKey: string,
  address: string,
  account: KeychainAccount
) => Promise<void>

/**
 * KeychainAccountManager is responsible for adding, retrieving, and updating accounts stored on the keychain,
 * as well as implementing a locking mechanism that can be used by wallet implementations to ensure secure
 * access to accounts.
 *
 * Wallets may register a callback to run when an account is added to the keychain. This can be used to ensure
 * that if an account is added to a particular wallet, other wallets will also be able to re-use this account.
 */
class KeychainAccountManager {
  private accountLocks: Record<string, UnlockData>
  private accountInfo: Record<string, KeychainAccount>
  private addAccountCallbacks: AddAccountCallbackFn[]

  constructor() {
    this.accountLocks = {}
    this.accountInfo = {}
    this.addAccountCallbacks = []
  }

  async init(importMnemonicAccount: ImportMnemonicAccount) {
    await this.loadAccounts(importMnemonicAccount)
  }

  async loadAccounts(importMnemonicAccount: ImportMnemonicAccount): Promise<KeychainAccount[]> {
    const accounts = await listStoredAccounts(importMnemonicAccount)
    accounts.forEach((account) => {
      this.accountInfo[account.address] = account
    })
    return accounts
  }

  registerAddAccountCallback(cb: AddAccountCallbackFn) {
    this.addAccountCallbacks.push(cb)
  }

  async addAccount(privateKey: string, password: string): Promise<string> {
    const normalizedPrivateKey = normalizeAddressWith0x(privateKey)
    const address = normalizeAddressWith0x(privateKeyToAddress(normalizedPrivateKey))
    Logger.info(`${TAG}@addAccount`, `Adding a new account`)
    if (this.hasAccount(address)) {
      throw new Error(ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS)
    }
    const account: KeychainAccount = { address, createdAt: new Date() }

    await storePrivateKey(privateKey, account, password)
    this.accountInfo[address] = account
    // After we've stored the key on the keychain, update any wallets to notify them of
    // the new account.
    await Promise.all(
      this.addAccountCallbacks.map((cb) => cb(normalizedPrivateKey, address, account))
    )
    return address
  }

  hasAccount(address: string): boolean {
    return normalizeAddressWith0x(address) in this.accountInfo
  }

  async updateAccount(address: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const accountInfo = this.accountInfo?.[address]
    const privateKey = await getStoredPrivateKey(accountInfo, oldPassword)
    if (!privateKey) {
      return false
    }
    await storePrivateKey(privateKey, accountInfo, newPassword)
    return true
  }

  async unlockAccount(
    address: string,
    password: string,
    duration: number
  ): Promise<string | undefined> {
    const normalizedAddress = normalizeAddressWith0x(address)
    const accountInfo = this.accountInfo?.[normalizedAddress]
    const privateKey = await getStoredPrivateKey(accountInfo, password)
    if (!privateKey) {
      return
    }

    this.accountLocks[normalizedAddress] = {
      unlockTime: Date.now(),
      unlockDuration: duration,
    }
    return normalizeAddressWith0x(privateKey)
  }

  isAccountUnlocked(address: string) {
    const accountUnlockData = this.accountLocks?.[normalizeAddressWith0x(address)]
    if (
      accountUnlockData === undefined ||
      accountUnlockData?.unlockTime === undefined ||
      accountUnlockData?.unlockDuration === undefined
    ) {
      return false
    }

    if (accountUnlockData?.unlockDuration === 0) {
      return true
    }

    return accountUnlockData.unlockTime + accountUnlockData.unlockDuration * 1000 > Date.now()
  }
}

export default KeychainAccountManager
