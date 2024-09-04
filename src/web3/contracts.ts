/**
 * This file is called 'contracts' but it's responsibilities have changed over time.
 * It now manages contractKit and wallet initialization.
 * Leaving the name for recognizability to current devs
 */
import { Lock } from '@celo/base/lib/lock'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import { accountCreationTimeSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ContractKitEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_FORNO_URL } from 'src/config'
import { navigateToError } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'
import { sleep } from 'src/utils/sleep'
import getLockableViemWallet, { ViemWallet } from 'src/viem/getLockableWallet'
import { ImportMnemonicAccount, KeychainAccounts } from 'src/web3/KeychainAccounts'
import { KeychainWallet } from 'src/web3/KeychainWallet'
import { getHttpProvider } from 'src/web3/providers'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, select } from 'typed-redux-saga'
import { Address, Chain } from 'viem'

import Web3 from 'web3'

const TAG = 'web3/contracts'
const WAIT_FOR_CONTRACT_KIT_RETRIES = 10

let wallet: KeychainWallet | undefined
let contractKit: ContractKit | undefined

const viemWallets = new Map<Chain, ViemWallet>()
const appViemWallets = new Map<Chain, ViemWallet>()

const keychainAccounts = new KeychainAccounts()
const initContractKitLock = new Lock()

async function initWallet(importMnemonicAccount: ImportMnemonicAccount) {
  AppAnalytics.track(ContractKitEvents.init_contractkit_get_wallet_start)
  const newWallet = new KeychainWallet(importMnemonicAccount, keychainAccounts)
  AppAnalytics.track(ContractKitEvents.init_contractkit_get_wallet_finish)
  await newWallet.init()
  AppAnalytics.track(ContractKitEvents.init_contractkit_init_wallet_finish)
  return newWallet
}

export function* initContractKit() {
  try {
    AppAnalytics.track(ContractKitEvents.init_contractkit_start)

    if (contractKit || wallet) {
      throw new Error('Kit not properly destroyed')
    }

    Logger.info(`${TAG}@initContractKit`, `Initializing contractkit`)

    const walletAddress: string | null = yield* select(walletAddressSelector)
    const accountCreationTime: number = yield* select(accountCreationTimeSelector)

    // This is to migrate the existing account that used to be stored in the geth keystore
    const importMnemonicAccount = {
      address: walletAddress,
      createdAt: new Date(accountCreationTime),
    }
    Logger.info(`${TAG}@initContractKit`, 'Initializing wallet', importMnemonicAccount)

    wallet = yield* call(initWallet, importMnemonicAccount)

    const web3 = new Web3(getHttpProvider(DEFAULT_FORNO_URL))

    Logger.info(
      `${TAG}@initContractKit`,
      `Initialized wallet with accounts: ${wallet?.getAccounts()}`
    )

    contractKit = newKitFromWeb3(web3, wallet)
    Logger.info(`${TAG}@initContractKit`, 'Initialized kit')
    AppAnalytics.track(ContractKitEvents.init_contractkit_finish)
    return
  } catch (error) {
    Logger.error(`${TAG}@initContractKit`, 'Unexpected error initializing kit', error)
    navigateToError(ErrorMessages.CONTRACT_KIT_INIT_FAILED)
  }
}

async function waitForContractKit(tries: number) {
  while (!contractKit) {
    Logger.warn(`${TAG}@waitForContractKitAsync`, 'Contract Kit not yet initalised')
    if (tries > 0) {
      Logger.warn(`${TAG}@waitForContractKitAsync`, 'Sleeping then retrying')
      tries -= 1
      await sleep(1000)
    } else {
      throw new Error('Contract kit initialisation timeout')
    }
  }
  return contractKit
}

// This code assumes that the account for walletAddress already exists in the Keychain
// which is a responsibility currently handled by KeychainWallet
export function* getViemWallet(chain: Chain, useAppTransport?: boolean) {
  const walletsCache = useAppTransport ? appViemWallets : viemWallets
  if (walletsCache.has(chain)) {
    return walletsCache.get(chain) as ViemWallet
  }
  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress) {
    throw new Error('Wallet address not found')
  }
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

export function* getWallet() {
  if (!wallet) {
    yield* call([initContractKitLock, initContractKitLock.acquire])
    try {
      if (wallet) {
        return wallet
      }
      yield* call(initContractKit)
    } finally {
      initContractKitLock.release()
    }
  }
  return wallet as UnlockableWallet
}

// Used for cases where the wallet must be access outside of a saga
export async function getWalletAsync() {
  if (!wallet) {
    await waitForContractKit(WAIT_FOR_CONTRACT_KIT_RETRIES)
  }

  if (!wallet) {
    Logger.warn(`${TAG}@getWalletAsync`, 'gethWallet is undefined')
    throw new Error(
      'Geth wallet still undefined even after contract kit init. Should never happen.'
    )
  }

  return wallet
}
