/**
 * This file is called 'contracts' but it's responsibilities have changed over time.
 * It now manages contractKit and wallet initialization.
 * Leaving the name for recognizability to current devs
 */
import { Lock } from '@celo/base/lib/lock'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { sleep } from '@celo/utils/lib/async'
import GethBridge from 'react-native-geth'
import { call, delay, select } from 'redux-saga/effects'
import { ContractKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_FORNO_URL } from 'src/config'
import { isProviderConnectionError } from 'src/geth/geth'
import { GethNativeBridgeWallet } from 'src/geth/GethNativeBridgeWallet'
import { waitForGethInitialized, waitForGethSync, waitForGethSyncAsync } from 'src/geth/saga'
import { navigateToError } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'
import { getHttpProvider, getIpcProvider } from 'src/web3/providers'
import { fornoSelector } from 'src/web3/selectors'
import Web3 from 'web3'

const TAG = 'web3/contracts'
const KIT_INIT_RETRY_DELAY = 2000
const CONTRACT_KIT_RETRIES = 3
const WAIT_FOR_CONTRACT_KIT_RETRIES = 10

let wallet: GethNativeBridgeWallet | undefined
let contractKit: ContractKit | undefined

const initContractKitLock = new Lock()

async function initWallet() {
  ValoraAnalytics.track(ContractKitEvents.init_contractkit_get_wallet_start)
  const newWallet = new GethNativeBridgeWallet(GethBridge)
  ValoraAnalytics.track(ContractKitEvents.init_contractkit_get_wallet_finish)
  await newWallet.init()
  ValoraAnalytics.track(ContractKitEvents.init_contractkit_init_wallet_finish)
  return newWallet
}

function* initWeb3() {
  const fornoMode = yield select(fornoSelector)
  if (fornoMode) {
    return new Web3(getHttpProvider(DEFAULT_FORNO_URL))
  } else {
    ValoraAnalytics.track(ContractKitEvents.init_contractkit_get_ipc_start)
    const ipcProvider = getIpcProvider()
    ValoraAnalytics.track(ContractKitEvents.init_contractkit_get_ipc_finish)
    return new Web3(ipcProvider)
  }
}

export function* initContractKit() {
  ValoraAnalytics.track(ContractKitEvents.init_contractkit_start)
  let retries = CONTRACT_KIT_RETRIES
  // Wrap init in retries to handle cases where Geth is initialized but the
  // IPC is not ready yet. Without changing Geth + RN-Geth, we have no way to
  // listen for this readiness
  while (retries > 0) {
    try {
      if (contractKit || wallet) {
        throw new Error('Kit not properly destroyed')
      }

      ValoraAnalytics.track(ContractKitEvents.init_contractkit_geth_init_start, {
        retries: CONTRACT_KIT_RETRIES - retries,
      })
      yield call(waitForGethInitialized)
      ValoraAnalytics.track(ContractKitEvents.init_contractkit_geth_init_finish)

      const fornoMode = yield select(fornoSelector)

      Logger.info(`${TAG}@initContractKit`, `Initializing contractkit, forno mode: ${fornoMode}`)
      Logger.info(`${TAG}@initContractKit`, 'Initializing wallet')

      wallet = yield call(initWallet)
      const web3 = yield call(initWeb3)

      Logger.info(
        `${TAG}@initContractKit`,
        `Initialized wallet with accounts: ${wallet?.getAccounts()}`
      )

      contractKit = newKitFromWeb3(web3, wallet)
      Logger.info(`${TAG}@initContractKit`, 'Initialized kit')
      ValoraAnalytics.track(ContractKitEvents.init_contractkit_finish)
      return
    } catch (error) {
      if (isProviderConnectionError(error)) {
        retries -= 1
        Logger.warn(
          `${TAG}@initContractKit`,
          `Error initializing kit, could not connect to IPC. Retries remaining: ${retries}`,
          error
        )
        if (retries <= 0) {
          Logger.error(
            `${TAG}@initContractKit`,
            `Error initializing kit, could not connect to IPC.`,
            error
          )
          break
        }

        destroyContractKit()
        yield delay(KIT_INIT_RETRY_DELAY)
      } else {
        Logger.error(`${TAG}@initContractKit`, 'Unexpected error initializing kit', error)
        break
      }
    }
  }

  Logger.error(`${TAG}@initContractKit`, 'Kit init unsuccessful, navigating to error screen')
  navigateToError(ErrorMessages.CONTRACT_KIT_INIT_FAILED)
}

export function destroyContractKit() {
  Logger.debug(`${TAG}@closeContractKit`)
  contractKit = undefined
  wallet = undefined
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

export function* getContractKit(waitForSync: boolean = true) {
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

  if (waitForSync) {
    yield call(waitForGethSync)
  }

  return contractKit
}

// Used for cases where CK must be access outside of a saga
export async function getContractKitAsync(waitForSync: boolean = true): Promise<ContractKit> {
  await waitForContractKit(WAIT_FOR_CONTRACT_KIT_RETRIES)
  if (!contractKit) {
    Logger.warn(`${TAG}@getContractKitAsync`, 'contractKit is undefined')
    throw new Error('contractKit is undefined')
  }

  if (waitForSync) {
    await waitForGethSyncAsync()
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
export function* getWeb3(waitForSync: boolean = true) {
  const kit: ContractKit = yield call(getContractKit, waitForSync)
  return kit.connection.web3
}

// Used for cases where the kit's web3 must be accessed outside a saga
export async function getWeb3Async(waitForSync: boolean = true): Promise<Web3> {
  const kit = await getContractKitAsync(waitForSync)
  return kit.connection.web3
}
