import { BlockHeader } from '@celo/connect'
import { generateKeys, generateMnemonic, MnemonicStrength } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { UnlockableWallet } from '@celo/wallet-base'
import { RpcWalletErrors } from '@celo/wallet-rpc/lib/rpc-wallet'
import * as bip39 from 'react-native-bip39'
import { call, delay, put, race, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { setAccountCreationTime, setPromptForno } from 'src/account/actions'
import { generateSignedMessage } from 'src/account/saga'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { GethEvents, NetworkEvents, SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getMnemonicLanguage, storeCapsuleKeyShare, storeMnemonic } from 'src/backup/utils'
import { CapsuleWallet } from 'src/capsule/react-native/ReactNativeCapsuleWallet'
import { features } from 'src/flags'
import { cancelGethSaga } from 'src/geth/actions'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { deleteChainData, isProviderConnectionError } from 'src/geth/geth'
import { gethSaga, waitForGethConnectivity } from 'src/geth/saga'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { navigate, navigateToError } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  CANCELLED_PIN_INPUT,
  getPasswordSaga,
  retrieveSignedMessage,
} from 'src/pincode/authentication'
import { clearPasswordCaches } from 'src/pincode/PasswordCache'
import Logger from 'src/utils/Logger'
import {
  Actions,
  completeWeb3Sync,
  setAccount,
  SetAccountAction,
  setFornoMode,
  SetIsFornoAction,
  SetMtwAddressAction,
  updateWeb3SyncProgress,
  Web3SyncProgress,
} from 'src/web3/actions'
import { destroyContractKit, getWallet, getWeb3, initContractKit } from 'src/web3/contracts'
import { createAccountDek } from 'src/web3/dataEncryptionKey'
import {
  currentAccountSelector,
  fornoSelector,
  mtwAddressSelector,
  walletAddressSelector,
} from 'src/web3/selectors'
import { blockIsFresh, getLatestBlock } from 'src/web3/utils'
import { RootState } from '../redux/reducers'

const TAG = 'web3/saga'

const MNEMONIC_BIT_LENGTH = MnemonicStrength.s256_24words
// The timeout for web3 to complete syncing and the latestBlock to be > 0
export const SYNC_TIMEOUT = 2 * 60 * 1000 // 2 minutes
const SWITCH_TO_FORNO_TIMEOUT = 15000 // if syncing takes >15 secs, suggest switch to forno
const WEB3_MONITOR_DELAY = 100

enum SyncStatus {
  UNKNOWN,
  WAITING,
  SYNCING,
}

// checks if web3 claims it is currently syncing and attempts to wait for it to complete
export function* checkWeb3SyncProgress() {
  Logger.debug(TAG, 'checkWeb3SyncProgress', 'Checking sync progress')

  let syncLoops = 0
  let status = SyncStatus.UNKNOWN
  while (true) {
    try {
      // isSyncing returns a syncProgress object when it's still syncing, false otherwise
      const web3 = yield call(getWeb3, false)
      const syncProgress: boolean | Web3SyncProgress = yield call(web3.eth.isSyncing)

      if (typeof syncProgress === 'boolean' && !syncProgress) {
        Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync maybe complete, checking')

        const latestBlock: BlockHeader = yield call(getLatestBlock)
        if (latestBlock && blockIsFresh(latestBlock)) {
          yield put(completeWeb3Sync(latestBlock.number))
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync is complete')
          ValoraAnalytics.track(NetworkEvents.network_sync_finish, {
            latestBlock: latestBlock.number,
          })
          return true
        } else {
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync not actually complete, still waiting')
          if (status !== SyncStatus.WAITING) {
            status = SyncStatus.WAITING
            ValoraAnalytics.track(NetworkEvents.network_sync_waiting, {
              latestBlock: latestBlock?.number,
            })
          }
        }
      } else if (typeof syncProgress === 'object') {
        yield put(updateWeb3SyncProgress(syncProgress))
        if (status !== SyncStatus.SYNCING) {
          status = SyncStatus.SYNCING
          ValoraAnalytics.track(NetworkEvents.network_sync_start, syncProgress)
        }
      } else {
        throw new Error('Invalid syncProgress type')
      }
      yield delay(WEB3_MONITOR_DELAY) // wait 100ms while web3 syncs then check again
      syncLoops += 1

      // If sync has been in progrees for too long, prompt the user to try forno instead.
      if (syncLoops * WEB3_MONITOR_DELAY > SWITCH_TO_FORNO_TIMEOUT) {
        if (yield select(promptFornoIfNeededSelector) && features.DATA_SAVER) {
          ValoraAnalytics.track(NetworkEvents.network_sync_error, { error: 'sync timeout' })
          yield put(setPromptForno(false))
          navigate(Screens.Settings, { promptFornoModal: true })
          return true
        }
      }
    } catch (error) {
      ValoraAnalytics.track(NetworkEvents.network_sync_error, { error: error.message })
      if (isProviderConnectionError(error)) {
        ValoraAnalytics.track(GethEvents.blockchain_corruption)
        const deleted = yield call(deleteChainData)
        if (deleted) {
          navigateToError(ErrorMessages.CORRUPTED_CHAIN_DELETED)
        }
      } else {
        Logger.error(TAG, 'Unexpected sync error', error)
      }
      return false
    }
  }
}

export function* waitForWeb3Sync() {
  try {
    const { syncComplete, timeout, fornoSwitch } = yield race({
      syncComplete: call(checkWeb3SyncProgress),
      timeout: delay(SYNC_TIMEOUT),
      fornoSwitch: take(Actions.TOGGLE_IS_FORNO),
    })
    if (fornoSwitch) {
      Logger.debug(
        `${TAG}@waitForWeb3Sync`,
        'Switching providers, expected web3 sync failure occured'
      )
      return true
    }
    if (timeout || !syncComplete) {
      Logger.error(TAG, 'Could not complete sync')
      navigateToError('web3FailedToSync')
      return false
    }
    return true
  } catch (error) {
    Logger.error(TAG, 'checkWeb3Sync', error)
    navigateToError('errorDuringSync')
    return false
  }
}

export function* waitWeb3LastBlock() {
  yield call(waitForGethConnectivity)
  if (!(yield select(fornoSelector))) {
    yield call(waitForWeb3Sync)
  }
}

/**
 * Get existing or create new Capsule Account using the Capsule SDK,
 * assert that the server session is initialized.
 *
 * N.B. This saga will halt to create an account until the user is
 * proves a valid login with the Capsule server by awaiting
 * `yield take(Actions.CAPSULE_AUTHENTICATE)`.
 */
export function* getOrCreateCapsuleAccount() {
  // TODO
  // @note Account already exists
  const account: string = yield select(currentAccountSelector)
  if (account) {
    //   Logger.debug(TAG + '@getOrCreateCapsuleAccount', 'Account exists, loading keyshare')
    //   let privateKeyShare: string | null = ''
    //   privateKeyShare = yield call(getStoredCapsuleKeyShare, account)
    //   if (privateKeyShare != null) {
    //     const wallet: CapsuleWallet = yield call(getWallet)
    //     try {
    //       yield call([wallet, wallet.addAccount, privateKeyShare])
    //     } catch (e) {
    //       if (e.message === ErrorMessages.CAPSULE_ACCOUNT_ALREADY_EXISTS) {
    //         Logger.warn(TAG + '@createAndAssignCapsuleAccount', 'Attempted to import same account')
    //       } else {
    //         Logger.error(TAG + '@createAndAssignCapsuleAccount', 'Error importing raw key')
    //         throw e
    //       }
    //     }
    //   }
    //   Logger.debug(TAG + '@getOrCreateCapsuleAccount', 'Loaded keyshare')
    //   return account
  } else {
    // @note Account does not exist, needs to be set up
    let hasLoggedIn: boolean = false
    while (!hasLoggedIn) {
      Logger.debug(TAG, '@getOrCreateCapsuleAccount', 'Waiting on Capsule SDK Authentication')
      const { verified } = yield take(Actions.CAPSULE_AUTHENTICATE)
      hasLoggedIn = verified
    }
    try {
      Logger.debug(TAG + '@getOrCreateCapsuleAccount', 'Creating a new account')
      const accountAddress: string = yield call(createAndAssignCapsuleAccount)
      if (!accountAddress) {
        throw new Error('Failed to assign account from key share')
      }
      return accountAddress
    } catch (error) {
      Logger.error(TAG + '@getOrCreateAccount', 'Error creating account')
      throw new Error(ErrorMessages.ACCOUNT_SETUP_FAILED)
    }
  }
}

export function* getOrCreateAccount() {
  const account: string = yield select(currentAccountSelector)
  if (account) {
    Logger.debug(
      TAG + '@getOrCreateAccount',
      'Tried to create account twice, returning the existing one'
    )
    return account
  }

  let privateKey: string | undefined
  try {
    Logger.debug(TAG + '@getOrCreateAccount', 'Creating a new account')

    const mnemonicLanguage = getMnemonicLanguage(yield select(currentLanguageSelector))
    let mnemonic: string = yield call(
      generateMnemonic,
      MNEMONIC_BIT_LENGTH,
      mnemonicLanguage,
      bip39
    )

    // Ensure no duplicates in mnemonic
    const checkDuplicate = (someString: string) => {
      return new Set(someString.split(' ')).size !== someString.split(' ').length
    }
    let duplicateInMnemonic = checkDuplicate(mnemonic)
    while (duplicateInMnemonic) {
      Logger.debug(TAG + '@getOrCreateAccount', 'Regenerating mnemonic to avoid duplicates')
      mnemonic = yield call(generateMnemonic, MNEMONIC_BIT_LENGTH, mnemonicLanguage, bip39)
      duplicateInMnemonic = checkDuplicate(mnemonic)
    }

    if (!mnemonic) {
      throw new Error('Failed to generate mnemonic')
    }

    const keys = yield call(generateKeys, mnemonic, undefined, undefined, undefined, bip39)
    privateKey = keys.privateKey
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    const accountAddress: string = yield call(assignAccountFromPrivateKey, privateKey, mnemonic)
    if (!accountAddress) {
      throw new Error('Failed to assign account from private key')
    }

    yield call(storeMnemonic, mnemonic, accountAddress)

    return accountAddress
  } catch (error) {
    const sanitizedError = Logger.sanitizeError(error, privateKey)
    Logger.error(TAG + '@getOrCreateAccount', 'Error creating account', sanitizedError)
    throw new Error(ErrorMessages.ACCOUNT_SETUP_FAILED)
  }
}

export function* assignAccountFromPrivateKey(privateKey: string, mnemonic: string) {
  try {
    const account = privateKeyToAddress(privateKey)
    const wallet: UnlockableWallet = yield call(getWallet)
    const password: string = yield call(getPasswordSaga, account, false, true)

    try {
      yield call([wallet, wallet.addAccount], privateKey, password)
    } catch (e) {
      if (
        e.message === RpcWalletErrors.AccountAlreadyExists ||
        e.message === ErrorMessages.GETH_ACCOUNT_ALREADY_EXISTS
      ) {
        Logger.warn(TAG + '@assignAccountFromPrivateKey', 'Attempted to import same account')
      } else {
        Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error importing raw key')
        throw e
      }

      yield call([wallet, wallet.unlockAccount], account, password, UNLOCK_DURATION)
    }

    Logger.debug(TAG + '@assignAccountFromPrivateKey', `Added to wallet: ${account}`)
    yield put(setAccount(account))
    yield put(setAccountCreationTime(Date.now()))
    yield call(createAccountDek, mnemonic)
    return account
  } catch (e) {
    Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error assigning account', e)
    throw e
  }
}

/**
 * Initialize the in-memory wallet, and signer. This function initializes the
 * session by registering the user's public key with the server.
 *
 * Once this is done, create an initial `account` address using multi-party computation
 * from Capsule servers.
 *
 * N.B. When a new `account` is created, a `RECOVERY` keyshare is generated and
 * is securely communicated to the user.
 */
export function* createAndAssignCapsuleAccount() {
  try {
    Logger.debug(TAG + '@createAndAssignCapsuleAccount', 'Attempting to create wallet')
    const wallet: CapsuleWallet = yield call(getWallet)
    Logger.debug(TAG + '@createAndAssignCapsuleAccount', 'Capsule Wallet initialized')
    let account: string
    try {
      yield call([wallet, wallet.initSessionManagement])
      account = yield call([wallet, wallet.addAccount], undefined, (recoveryKeyshare) =>
        // TODO: send it e.g., via e-mail to the user
        Logger.info(`RECOVERY: ${recoveryKeyshare}`)
      )
      void wallet.getKeyshare(account).then((privateKeyShare) => {
        void storeCapsuleKeyShare(privateKeyShare, account)
      })
      Logger.debug(TAG + '@createAndAssignCapsuleAccount', `Added to wallet: ${account}`)
      yield put(setAccount(account))
      yield put(setAccountCreationTime(Date.now()))
      // yield call(createAccountDek, mnemonic)
      return account
    } catch (e: any) {
      if (e.message === ErrorMessages.CAPSULE_ACCOUNT_ALREADY_EXISTS) {
        Logger.warn(TAG + '@createAndAssignCapsuleAccount', 'Attempted to import same account')
      } else {
        Logger.error(TAG + '@createAndAssignCapsuleAccount', 'Error importing raw key')
        throw e
      }
    }
  } catch (e) {
    Logger.error(TAG + '@createAndAssignCapsuleAccount', 'Error assigning account', e)
    throw e
  }
}

/**
 * Get an address associated with the user account.
 *
 * Waits for the address to exist, then returns it.
 *
 * Used to help make getWalletAddress and getMTWAddress more DRY (since they are almost exactly the same).
 *
 * @param addressSelector
 * @param action
 */
function* getAddress<T extends { address: string | null }>({
  addressSelector,
  action,
}: {
  addressSelector: (state: RootState) => string | null
  action: Actions
}) {
  while (true) {
    const account = yield select(addressSelector)
    if (account) {
      return account
    }

    const actionEffect: T = yield take(action)
    if (actionEffect.address) {
      // account exists
      return actionEffect.address
    }
  }
}

// Wait for account to exist and then return it
export function* getWalletAddress() {
  return yield getAddress<SetAccountAction>({
    addressSelector: walletAddressSelector,
    action: Actions.SET_ACCOUNT,
  })
}

// wait for MTW to exist and then return it
export function* getMTWAddress() {
  return yield getAddress<SetMtwAddressAction>({
    addressSelector: mtwAddressSelector,
    action: Actions.SET_MTW_ADDRESS,
  })
}

// deprecated, please use |getWalletAddress| instead.
// This needs to be refactored and removed since the name is misleading.
export const getAccount = getWalletAddress

export enum UnlockResult {
  SUCCESS,
  FAILURE,
  CANCELED,
}

export function* unlockAccount(account: string, force: boolean = false) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)

  const wallet: UnlockableWallet = yield call(getWallet)
  if (!force && wallet.isAccountUnlocked(account)) {
    return UnlockResult.SUCCESS
  }

  try {
    const password: string = yield call(getPasswordSaga, account)

    const result = yield call([wallet, wallet.unlockAccount], account, password, UNLOCK_DURATION)
    if (!result) {
      throw new Error('Unlock account result false')
    }

    Logger.debug(TAG + '@unlockAccount', `Account unlocked: ${account}`)
    return UnlockResult.SUCCESS
  } catch (error) {
    if (error === CANCELLED_PIN_INPUT) {
      return UnlockResult.CANCELED
    }
    Logger.error(TAG + '@unlockAccount', 'Account unlock failed, clearing password caches', error)
    clearPasswordCaches()
    return UnlockResult.FAILURE
  }
}

// Wait for geth to be connected and account ready
export function* getConnectedAccount() {
  yield call(waitForGethConnectivity)
  const account: string = yield call(getAccount)
  return account
}

// Wait for geth to be connected, geth ready, and get unlocked account
export function* getConnectedUnlockedAccount() {
  const account: string = yield call(getConnectedAccount)
  const result: UnlockResult = yield call(unlockAccount, account)
  if (result === UnlockResult.SUCCESS) {
    const signedMessage = yield call(retrieveSignedMessage)
    if (!signedMessage) {
      try {
        yield call(generateSignedMessage)
      } catch (error) {
        Logger.error(
          `${TAG}@getConnectedUnlockedAccount`,
          'Unable to generate signed message and update account registration',
          error
        )
      }
    }
    return account
  } else {
    throw new Error(
      result === UnlockResult.FAILURE
        ? ErrorMessages.INCORRECT_PIN
        : ErrorMessages.PIN_INPUT_CANCELED
    )
  }
}

// This will return MTW if there is one and the EOA if
// there isn't. Eventually need to change naming convention
// used elsewhere that errouneously refers to the EOA
// as `account`
export function* getAccountAddress() {
  const walletAddress: string = yield call(getAccount)
  const mtwAddress: string | null = yield select(mtwAddressSelector)
  return mtwAddress ?? walletAddress
}

export function* toggleFornoMode({ fornoMode }: SetIsFornoAction) {
  Logger.info(TAG + '@toggleFornoMode', ` to: ${fornoMode}`)
  const currentFornoMode = yield select(fornoSelector)
  if (currentFornoMode === fornoMode) {
    Logger.warn(TAG + '@toggleFornoMode', ` already in desired state: ${fornoMode}`)
    return
  }

  try {
    destroyContractKit()
    yield put(setFornoMode(fornoMode))
    yield put(cancelGethSaga())
    yield spawn(gethSaga)
    yield call(initContractKit)
    ValoraAnalytics.track(SettingsEvents.forno_toggle, { enabled: fornoMode })
  } catch (error) {
    Logger.error(TAG + '@toggleFornoMode', 'Error toggling forno mode', error)
    yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
  }
}

export function* watchFornoMode() {
  yield takeLatest(Actions.TOGGLE_IS_FORNO, toggleFornoMode)
}

export function* web3Saga() {
  yield spawn(initContractKit)
  yield spawn(watchFornoMode)
  yield spawn(waitWeb3LastBlock)
}
