/**
 * This file is called 'contracts' but it's responsibilities have changed over time.
 * It now manages contractKit and wallet initialization.
 * Leaving the name for recognizability to current devs
 */
import { Lock } from '@celo/base/lib/lock'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { sleep } from '@celo/utils/lib/async'
import { call, select } from 'redux-saga/effects'
import { accountCreationTimeSelector } from 'src/account/selectors'
import { ContractKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_FORNO_URL } from 'src/config'
import { navigateToError } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'
import { importDekIfNecessary } from 'src/web3/dataEncryptionKey'
import { ImportMnemonicAccount } from 'src/web3/KeychainSigner'
import { getHttpProvider } from 'src/web3/providers'
import { walletAddressSelector } from 'src/web3/selectors'
import Web3 from 'web3'
import WalletManager from 'src/web3/WalletManager'
import { PrimaryValoraWallet } from 'src/web3/types'

const TAG = 'web3/contracts'
const WAIT_FOR_CONTRACT_KIT_RETRIES = 10

let walletManager: WalletManager | undefined
let wallet: PrimaryValoraWallet | undefined
let contractKit: ContractKit | undefined

const initContractKitLock = new Lock()

async function initWalletManager(importMnemonicAccount: ImportMnemonicAccount) {
  ValoraAnalytics.track(ContractKitEvents.init_contractkit_get_wallet_start)
  const newManager = new WalletManager(importMnemonicAccount)
  ValoraAnalytics.track(ContractKitEvents.init_contractkit_get_wallet_finish)
  await newManager.init()
  ValoraAnalytics.track(ContractKitEvents.init_contractkit_init_wallet_finish)
  return newManager
}

export function* initContractKit() {
  try {
    ValoraAnalytics.track(ContractKitEvents.init_contractkit_start)

    if (contractKit || wallet || walletManager) {
      throw new Error('Kit not properly destroyed')
    }

    Logger.info(`${TAG}@initContractKit`, `Initializing contractkit`)

    const walletAddress: string | null = yield select(walletAddressSelector)
    const accountCreationTime: number = yield select(accountCreationTimeSelector)

    // This is to migrate the existing account that used to be stored in the geth keystore
    const importMnemonicAccount = {
      address: walletAddress,
      createdAt: new Date(accountCreationTime),
    }
    Logger.info(`${TAG}@initContractKit`, 'Initializing wallet', importMnemonicAccount)

    walletManager = yield call(initWalletManager, importMnemonicAccount)
    const valoraCeloWallet = walletManager?.getContractKitWallet()
    wallet = valoraCeloWallet
    try {
      // This is to migrate the existing DEK that used to be stored in the geth keystore
      // Note that the DEK is also currently in the redux store, but it should change at some point
      if (walletAddress) {
        yield call(importDekIfNecessary, wallet)
      }
    } catch (error) {
      Logger.error(`${TAG}@initContractKit`, `Failed to import data encryption key`, error)
    }

    const web3 = new Web3(getHttpProvider(DEFAULT_FORNO_URL))

    Logger.info(
      `${TAG}@initContractKit`,
      `Initialized wallet with accounts: ${wallet?.getAccounts()}`
    )

    contractKit = newKitFromWeb3(web3, valoraCeloWallet?.getKeychainWallet())
    Logger.info(`${TAG}@initContractKit`, 'Initialized kit')
    ValoraAnalytics.track(ContractKitEvents.init_contractkit_finish)
    return
  } catch (error) {
    Logger.error(`${TAG}@initContractKit`, 'Unexpected error initializing kit', error)
    navigateToError(ErrorMessages.CONTRACT_KIT_INIT_FAILED)
  }
}

export function destroyContractKit() {
  Logger.debug(`${TAG}@closeContractKit`)
  contractKit = undefined
  wallet = undefined
  walletManager = undefined
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

export function* getContractKit() {
  if (!contractKit) {
    yield initContractKitLock.acquire()
    try {
      if (contractKit) {
        return contractKit
      }
      yield call(initContractKit)
    } finally {
      initContractKitLock.release()
    }
  }

  return contractKit
}

// Used for cases where CK must be access outside of a saga
export async function getContractKitAsync(): Promise<ContractKit> {
  await waitForContractKit(WAIT_FOR_CONTRACT_KIT_RETRIES)
  if (!contractKit) {
    Logger.warn(`${TAG}@getContractKitAsync`, 'contractKit is undefined')
    throw new Error('contractKit is undefined')
  }

  return contractKit
}

export function* getWallet() {
  if (!wallet) {
    yield initContractKitLock.acquire()
    try {
      if (wallet) {
        return wallet
      }
      yield call(initContractKit)
    } finally {
      initContractKitLock.release()
    }
  }
  return wallet
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

// Convinience util for getting the kit's web3 instance
export function* getWeb3() {
  const kit: ContractKit = yield call(getContractKit)
  return kit.connection.web3
}

// Used for cases where the kit's web3 must be accessed outside a saga
export async function getWeb3Async(): Promise<Web3> {
  const kit = await getContractKitAsync()
  return kit.connection.web3
}
