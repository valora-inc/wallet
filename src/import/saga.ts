import {
  generateKeys,
  invalidMnemonicWords,
  normalizeMnemonic,
  suggestMnemonicCorrections,
  validateMnemonic,
} from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { Task } from '@redux-saga/types'
import { retrieveKeyshare } from '@usecapsule/react-native-wallet/src/transmissionUtils'
import * as bip39 from 'react-native-bip39'
import {
  call,
  cancel,
  delay,
  fork,
  join,
  put,
  race,
  select,
  spawn,
  take,
  takeLeading,
} from 'redux-saga/effects'
import {
  Actions as AccountActions,
  initializeAccount,
  setAccountCreationTime,
  setBackupCompleted,
} from 'src/account/actions'
import { uploadNameAndPicture } from 'src/account/profileInfo'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { AppEvents, KeyshareEvents, OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { skipVerificationSelector } from 'src/app/selectors'
import { countMnemonicWords, storeCapsuleKeyShare, storeMnemonic } from 'src/backup/utils'
import { refreshAllBalances } from 'src/home/actions'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import {
  Actions,
  HandleKeyshareDetected,
  ImportBackupPhraseAction,
  importBackupPhraseFailure,
  importBackupPhraseSuccess,
  importRecoveryKeyshare,
  ImportRecoveryKeyshareAction,
  importUserKeyshare,
  ImportUserKeyshareSecretAction,
} from 'src/import/actions'
import { navigate, navigateClearingStack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getPasswordSaga } from 'src/pincode/authentication'
import { keyshareDataFromUrl } from 'src/qrcode/schema'
import { fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { setAccount } from 'src/web3/actions'
import { getWallet } from 'src/web3/contracts'
import { assignAccountFromPrivateKey, waitWeb3LastBlock } from 'src/web3/saga'
import { ZedWallet } from 'src/web3/wallet'

const TAG = 'import/saga'

export const MAX_BALANCE_CHECK_TASKS = 5
export const MNEMONIC_AUTOCORRECT_TIMEOUT = 5000 // ms

export function* importBackupPhraseSaga({ phrase, useEmptyWallet }: ImportBackupPhraseAction) {
  Logger.debug(TAG + '@importBackupPhraseSaga', 'Importing backup phrase')
  yield call(waitWeb3LastBlock)
  try {
    const normalizedPhrase = normalizeMnemonic(phrase)
    const phraseIsValid = validateMnemonic(normalizedPhrase, bip39)
    const invalidWords = phraseIsValid ? [] : invalidMnemonicWords(normalizedPhrase)

    if (!phraseIsValid) {
      ValoraAnalytics.track(OnboardingEvents.wallet_import_phrase_invalid, {
        wordCount: countMnemonicWords(normalizedPhrase),
        invalidWordCount: invalidWords?.length,
      })
    }

    // If the given mnemonic phrase is invalid, spend up to 5 seconds trying to correct it.
    // A balance check happens before the phrase is returned, so if the phrase was autocorrected,
    // we do not need to check the balance again later in this method.
    // If useEmptyWallet is true, skip this step. It only helps find non-empty wallets.
    let mnemonic = phraseIsValid ? normalizedPhrase : undefined
    let checkedBalance = false
    if (!phraseIsValid && !useEmptyWallet) {
      try {
        const { correctedPhrase, timeout } = yield race({
          correctedPhrase: call(attemptBackupPhraseCorrection, normalizedPhrase),
          timeout: delay(MNEMONIC_AUTOCORRECT_TIMEOUT),
        })
        if (correctedPhrase) {
          Logger.info(TAG + '@importBackupPhraseSaga', 'Using suggested mnemonic autocorrection')
          mnemonic = correctedPhrase
          checkedBalance = true
        } else {
          Logger.info(
            TAG + '@importBackupPhraseSaga',
            `Backup phrase autocorrection ${timeout ? 'timed out' : 'failed'}`
          )
          ValoraAnalytics.track(OnboardingEvents.wallet_import_phrase_correction_failed, {
            timeout: timeout !== undefined,
          })
        }
      } catch (error) {
        Logger.error(
          TAG + '@importBackupPhraseSaga',
          `Encountered an error trying to correct a phrase`,
          error
        )
        ValoraAnalytics.track(OnboardingEvents.wallet_import_phrase_correction_failed, {
          timeout: false,
          error: error.message,
        })
      }
    }

    // If the input phrase was invalid, and the correct phrase could not be found automatically,
    // report an error to the user.
    if (mnemonic === undefined) {
      Logger.warn(TAG + '@importBackupPhraseSaga', 'Invalid mnemonic')
      if (invalidWords !== undefined && invalidWords.length > 0) {
        yield put(
          showError(ErrorMessages.INVALID_WORDS_IN_BACKUP_PHRASE, null, {
            invalidWords: invalidWords.join(', '),
          })
        )
      } else {
        yield put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      }
      yield put(importBackupPhraseFailure())
      return
    }

    const { privateKey } = yield call(
      generateKeys,
      mnemonic,
      undefined,
      undefined,
      undefined,
      bip39
    )
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    // Check that the provided mnemonic derives an account with at least some balance. If the wallet
    // is empty, and useEmptyWallet is not true, display a warning to the user before they continue.
    if (!useEmptyWallet && !checkedBalance) {
      const backupAccount = privateKeyToAddress(privateKey)
      const hasBalance: boolean = yield call(walletHasBalance, backupAccount)
      if (!hasBalance) {
        yield put(importBackupPhraseSuccess())
        ValoraAnalytics.track(OnboardingEvents.wallet_import_zero_balance, {
          account: backupAccount,
        })
        navigate(Screens.ImportWallet, { clean: false, showZeroBalanceModal: true })
        return
      }
    }

    const account: string | null = yield call(assignAccountFromPrivateKey, privateKey, mnemonic)
    if (!account) {
      throw new Error('Failed to assign account from private key')
    }

    // Set key in phone's secure store
    yield call(storeMnemonic, mnemonic, account)
    // Set backup complete so user isn't prompted to do backup flow
    yield put(setBackupCompleted())
    yield put(refreshAllBalances())
    yield call(uploadNameAndPicture)

    const recoveringFromStoreWipe: boolean = yield select(recoveringFromStoreWipeSelector)
    if (recoveringFromStoreWipe) {
      ValoraAnalytics.track(AppEvents.redux_store_recovery_success, { account })
    }
    ValoraAnalytics.track(OnboardingEvents.wallet_import_success)
    const skipVerification: boolean = yield select(skipVerificationSelector)
    if (skipVerification) {
      yield put(initializeAccount())
      yield put(setHasSeenVerificationNux(true))
      navigateHome()
    } else {
      navigateClearingStack(Screens.VerificationEducationScreen)
    }

    yield put(importBackupPhraseSuccess())
  } catch (error: any) {
    Logger.error(TAG + '@importBackupPhraseSaga', 'Error importing backup phrase', error)
    yield put(showError(ErrorMessages.IMPORT_BACKUP_FAILED))
    yield put(importBackupPhraseFailure())
    ValoraAnalytics.track(OnboardingEvents.wallet_import_error, { error: error.message })
  }
}

export function* handleIncomingKeyshares(action: HandleKeyshareDetected) {
  const { data: keyshare } = action

  if (keyshare.data.startsWith('kolektivo://keyshare/User')) {
    ValoraAnalytics.track(KeyshareEvents.import_user_keyshare_started)
    yield put(importUserKeyshare(keyshare.data))
  } else if (keyshare.data.startsWith('kolektivo://keyshare/Recovery')) {
    yield put(importRecoveryKeyshare(keyshare.data))
  }
}

/**
 * Use the keyshare secret to decrypt the downloaded User Keyshare from Capsule,
 * and initialize the Wallet and Account with the Keyshare
 */
export function* importUserKeyshareSaga({ keyshareSecret }: ImportUserKeyshareSecretAction) {
  Logger.debug(TAG, '@importUserKeyshareSaga', 'Starting Decryption of User Keyshare')
  try {
    const { secret } = yield call(keyshareDataFromUrl, keyshareSecret)
    const wallet: ZedWallet = yield call(getWallet)
    yield call([wallet, wallet.initSessionManagement])
    const keyshare: string = yield call(retrieveKeyshare, secret)
    const account: string = yield call([wallet, wallet.importAccount], keyshare)
    const cachedKeyshare: string = yield call([wallet, wallet.getKeyshare], account)
    if (keyshare !== cachedKeyshare) {
      throw new Error('Keyshare Import FAILED')
    }
    yield navigate(Screens.NameAndPicture)
    yield call(attemptKeyshareStorage, account)
  } catch (error: any) {
    Logger.debug(TAG, '@importUserKeyshareSaga', JSON.stringify(error))
    Logger.debug(TAG, '@importUserKeyshareSaga', JSON.stringify(error.response.data))
    ValoraAnalytics.track(KeyshareEvents.import_user_keyshare_failure)
    yield put(showError(ErrorMessages.CAPSULE_KEYSHARE_DECRYPTION_FAILED, 2000))
  }
  return
}

export function* attemptKeyshareStorage(account: string) {
  Logger.debug(TAG, '@importUserKeyshareSaga', 'Starting Import of User Keyshare')
  try {
    yield take(AccountActions.SET_PINCODE_SUCCESS)
    const wallet: ZedWallet = yield call(getWallet)
    const keyshare: string = yield call([wallet, wallet.getKeyshare], account)
    yield call(getPasswordSaga, account, false, true)
    yield call(storeCapsuleKeyShare, keyshare, account)
    ValoraAnalytics.track(KeyshareEvents.import_user_keyshare_success)
    yield put(setAccount(account))
    yield put(setAccountCreationTime(Date.now()))
  } catch (error: any) {
    Logger.debug(TAG, '@attemptKeyshareStorage', error)
    yield put(showError(ErrorMessages.CAPSULE_KEYSHARE_DECRYPTION_FAILED, 2000))
  }
  return
}

export function* importRecoveryKeyshareSaga({ keyshare }: ImportRecoveryKeyshareAction) {
  // @todo Execute Capsule logic for importing recovery key
  try {
    const wallet: ZedWallet = yield call(getWallet)
    yield call([wallet, wallet.initSessionManagement])
    const account: string = yield call(
      [wallet, wallet.recoverAccountFromRecoveryKeyshare],
      keyshare,
      () => {}
    )
    const cachedUserKeyshare: string = yield call([wallet, wallet.getKeyshare], account)
    yield call(storeCapsuleKeyShare, cachedUserKeyshare, account)
    if (!account) {
      throw new Error('Recovery keyshare provided is invalid.')
    }
    yield put(setAccount(account))
    yield put(setAccountCreationTime(Date.now()))
  } catch (error: any) {
    Logger.debug(TAG, '@importRecoveryKeyshareSaga', error)
  }
}

// Uses suggestMnemonicCorrections to generate valid mnemonic phrases that are likely given the
// invalid phrase that the user entered. Checks the balance of any phrase the generator suggests
// before returning it. If the wallet has non-zero balance, then we are be very confident that its
// the account the user was actually trying to restore. Otherwise, this method does not return any
// suggested correction.
function* attemptBackupPhraseCorrection(mnemonic: string) {
  // Counter of how many suggestions have been tried and a list of tasks for ongoing balance checks.
  let counter = 0
  let tasks: { index: number; suggestion: string; task: Task; done: boolean }[] = []
  for (const suggestion of suggestMnemonicCorrections(mnemonic)) {
    ValoraAnalytics.track(OnboardingEvents.wallet_import_phrase_correction_attempt)

    Logger.info(
      TAG + '@attemptBackupPhraseCorrection',
      `Checking account balance on suggestion #${++counter}`
    )
    const { privateKey } = yield call(
      generateKeys,
      suggestion,
      undefined,
      undefined,
      undefined,
      bip39
    )
    if (!privateKey) {
      Logger.error(TAG + '@attemptBackupPhraseCorrection', 'Failed to convert mnemonic to hex')
      continue
    }

    // Push a new check wallet balance task onto the list of running tasks.
    // If our list of tasks is full, wait for at least one to finish.
    tasks.push({
      index: counter,
      suggestion,
      task: yield fork(walletHasBalance, privateKeyToAddress(privateKey)),
      done: false,
    })
    if (tasks.length >= MAX_BALANCE_CHECK_TASKS) {
      yield race(tasks.map(({ task }) => join(task)))
    }

    // Check the results of any balance check tasks. Prune any that have finished, and leave those
    // that are still running. If any return a positive result, cancel remaining tasks and return.
    for (const task of tasks) {
      const result = task.task.result()
      if (result === undefined) {
        continue
      }
      // Erase the task to mark that it has been checked.
      task.done = true

      if (result) {
        Logger.info(
          TAG + '@attemptBackupPhraseCorrection',
          `Found correction phrase with balance in attempt ${task.index}`
        )
        ValoraAnalytics.track(OnboardingEvents.wallet_import_phrase_correction_success, {
          attemptNumber: task.index,
        })
        // Cancel any remaining tasks.
        cancel(tasks.map(({ task }) => task))
        return task.suggestion
      }
    }
    tasks = tasks.filter((task) => !task.done)
  }
  return undefined
}

/**
 * Check the CELO, cUSD, and cEUR balances of the given address, returning true if any are greater
 * than zero. Returns as soon as a single balance check request comes back positive.
 */
function* walletHasBalance(address: string) {
  Logger.debug(TAG + '@walletHasBalance', 'Checking account balance')
  let requests = [
    yield fork(fetchTokenBalanceInWeiWithRetry, Currency.Euro, address),
    yield fork(fetchTokenBalanceInWeiWithRetry, Currency.Dollar, address),
    yield fork(fetchTokenBalanceInWeiWithRetry, Currency.Celo, address),
  ]
  while (requests.length > 0) {
    const balances = yield race(requests.map((req) => join(req)))
    for (const balance of balances) {
      if (balance?.isGreaterThan(0)) {
        // Cancel any remaining requests.
        cancel(requests)
        return true
      }
    }
    requests = requests.filter((_, i) => balances[i] === undefined)
  }

  return false
}

export function* watchImportBackupPhrase() {
  yield takeLeading(Actions.IMPORT_BACKUP_PHRASE, importBackupPhraseSaga)
}

export function* watchKeyshareScans() {
  yield takeLeading(Actions.KEYSHARE_DETECTED, handleIncomingKeyshares)
}

export function* watchImportUserKeyshare() {
  yield takeLeading(Actions.IMPORT_USER_KEYSHARE, importUserKeyshareSaga)
}

export function* watchImportRecoveryKeyshare() {
  yield takeLeading(Actions.IMPORT_RECOVERY_KEYSHARE, importRecoveryKeyshareSaga)
}

export function* importSaga() {
  yield spawn(watchImportBackupPhrase)
  yield spawn(watchKeyshareScans)
  yield spawn(watchImportUserKeyshare)
  yield spawn(watchImportRecoveryKeyshare)
}
