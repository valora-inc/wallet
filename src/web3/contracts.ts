/**
 * This file is called 'contracts' but it's responsibilities have changed over time.
 * It now manages keychain and wallet initialization.
 * Leaving the name for recognizability to current devs
 */
import { accountCreationTimeSelector } from 'src/account/selectors'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'
import getLockableViemWallet, { ViemWallet } from 'src/viem/getLockableWallet'
import { KeychainAccounts } from 'src/web3/KeychainAccounts'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, select } from 'typed-redux-saga'
import { Address, Chain } from 'viem'

const TAG = 'web3/contracts'

const viemWallets = new Map<Chain, ViemWallet>()
const appViemWallets = new Map<Chain, ViemWallet>()

let initKeychainAccountsPromise: Promise<KeychainAccounts> | null = null

// This should be called only via getKeychainAccounts
// To ensure it's only called once
async function initKeychainAccounts() {
  Logger.info(`${TAG}@initKeychainAccounts`, `Initializing`)

  const state = store.getState()
  const walletAddress = walletAddressSelector(state)
  const accountCreationTime = accountCreationTimeSelector(state)

  // This is to migrate the existing account that used to be stored in the geth keystore
  const importMnemonicAccount = {
    address: walletAddress,
    createdAt: new Date(accountCreationTime),
  }
  Logger.info(`${TAG}@initKeychainAccounts`, 'Initializing wallet', importMnemonicAccount)

  const keychainAccounts = new KeychainAccounts()
  const existingAccounts = await keychainAccounts.loadExistingAccounts(importMnemonicAccount)

  Logger.info(`${TAG}@initKeychainAccounts`, `Initialized with accounts: ${existingAccounts}`)

  return keychainAccounts
}

export function getKeychainAccounts(): Promise<KeychainAccounts> {
  initKeychainAccountsPromise = initKeychainAccountsPromise || initKeychainAccounts()

  return initKeychainAccountsPromise
}

// This code assumes that the account for walletAddress already exists in the Keychain
// which is a responsibility currently handled by KeychainAccounts
export function* getViemWallet(chain: Chain, useAppTransport?: boolean) {
  const walletsCache = useAppTransport ? appViemWallets : viemWallets
  if (walletsCache.has(chain)) {
    return walletsCache.get(chain) as ViemWallet
  }
  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress) {
    throw new Error('Wallet address not found')
  }
  const keychainAccounts = yield* call(getKeychainAccounts)
  const wallet = getLockableViemWallet(
    keychainAccounts,
    chain,
    walletAddress as Address,
    useAppTransport
  )
  Logger.debug(`${TAG}@getViemWallet`, `Initialized wallet with account: ${wallet.account}`)
  walletsCache.set(chain, wallet)
  return wallet
}
