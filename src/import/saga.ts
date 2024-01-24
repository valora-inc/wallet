import {
  invalidMnemonicWords,
  normalizeMnemonic,
  suggestMnemonicCorrections,
  validateMnemonic,
} from '@celo/cryptographic-utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { Task } from '@redux-saga/types'
import * as bip39 from 'react-native-bip39'
import { setBackupCompleted } from 'src/account/actions'
import { initializeAccountSaga } from 'src/account/saga'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { AppEvents, OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { countMnemonicWords, generateKeysFromMnemonic, storeMnemonic } from 'src/backup/utils'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  ImportBackupPhraseAction,
  importBackupPhraseFailure,
  importBackupPhraseSuccess,
} from 'src/import/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { goToNextOnboardingScreen, onboardingPropsSelector } from 'src/onboarding/steps'
import { FetchedTokenBalance, fetchTokenBalancesForAddress } from 'src/tokens/saga'
import { ensureError } from 'src/utils/ensureError'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { assignAccountFromPrivateKey } from 'src/web3/saga'
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
  takeLeading,
} from 'typed-redux-saga'

const TAG = 'import/saga'

export const MAX_BALANCE_CHECK_TASKS = 5
export const MNEMONIC_AUTOCORRECT_TIMEOUT = 5000 // ms

export function* importBackupPhraseSaga({ phrase, useEmptyWallet }: ImportBackupPhraseAction) {
  Logger.debug(TAG + '@importBackupPhraseSaga', 'Importing backup phrase')
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
        const { correctedPhrase, timeout } = yield* race({
          correctedPhrase: call(attemptBackupPhraseCorrection, normalizedPhrase),
          timeout: delay(MNEMONIC_AUTOCORRECT_TIMEOUT),
        })
        if (correctedPhrase) {
          Logger.info(TAG + '@importBackupPhraseSaga', 'Using suggested mnemonic autocorrection')
          // there is a bug with 'race' in typed-redux-saga, so we need to hard cast the result
          // https://github.com/agiledigital/typed-redux-saga/issues/43#issuecomment-1259706876
          mnemonic = correctedPhrase as unknown as string
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
      } catch (err) {
        const error = ensureError(err)
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
        yield* put(
          showError(ErrorMessages.INVALID_WORDS_IN_BACKUP_PHRASE, null, {
            invalidWords: invalidWords.join(', '),
          })
        )
      } else {
        yield* put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      }
      yield* put(importBackupPhraseFailure())
      return
    }

    const { privateKey } = yield* call(generateKeysFromMnemonic, mnemonic)
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    // Check that the provided mnemonic derives an account with at least some balance. If the wallet
    // is empty, and useEmptyWallet is not true, display a warning to the user before they continue.
    if (!useEmptyWallet && !checkedBalance) {
      const backupAccount = privateKeyToAddress(privateKey)
      if (!(yield* call(walletHasBalance, backupAccount))) {
        yield* put(importBackupPhraseSuccess())
        ValoraAnalytics.track(OnboardingEvents.wallet_import_zero_balance, {
          account: backupAccount,
        })
        navigate(Screens.ImportWallet, { clean: false, showZeroBalanceModal: true })
        return
      }
    }

    const account: string | null = yield* call(assignAccountFromPrivateKey, privateKey, mnemonic)
    if (!account) {
      throw new Error('Failed to assign account from private key')
    }

    // Set key in phone's secure store
    yield* call(storeMnemonic, mnemonic, account)
    // Set backup complete so user isn't prompted to do backup flow
    yield* put(setBackupCompleted())
    yield* put(refreshAllBalances())

    const recoveringFromStoreWipe = yield* select(recoveringFromStoreWipeSelector)
    if (recoveringFromStoreWipe) {
      ValoraAnalytics.track(AppEvents.redux_store_recovery_success, { account })
    }
    ValoraAnalytics.track(OnboardingEvents.wallet_import_success)
    yield* call(initializeAccountSaga)

    const onboardingProps = yield* select(onboardingPropsSelector)
    yield* call(goToNextOnboardingScreen, {
      firstScreenInCurrentStep: Screens.ImportWallet,
      onboardingProps,
    })

    yield* put(importBackupPhraseSuccess())
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG + '@importBackupPhraseSaga', 'Error importing backup phrase', error)
    yield* put(showError(ErrorMessages.IMPORT_BACKUP_FAILED))
    yield* put(importBackupPhraseFailure())
    ValoraAnalytics.track(OnboardingEvents.wallet_import_error, { error: error.message })
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
    const { privateKey } = yield* call(generateKeysFromMnemonic, suggestion)
    if (!privateKey) {
      Logger.error(TAG + '@attemptBackupPhraseCorrection', 'Failed to convert mnemonic to hex')
      continue
    }

    // Push a new check wallet balance task onto the list of running tasks.
    // If our list of tasks is full, wait for at least one to finish.
    tasks.push({
      index: counter,
      suggestion,
      task: yield* fork(walletHasBalance, privateKeyToAddress(privateKey)),
      done: false,
    })
    if (tasks.length >= MAX_BALANCE_CHECK_TASKS) {
      yield* race(tasks.map(({ task }) => join(task)))
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
        yield* cancel(tasks.map(({ task }) => task))
        return task.suggestion
      }
    }
    tasks = tasks.filter((task) => !task.done)
  }
  return undefined
}

/**
 * Check if the given address has a non-zero balance.
 */
function* walletHasBalance(address: string) {
  Logger.debug(TAG + '@walletHasBalance', 'Checking account balance')
  const tokenBalances: FetchedTokenBalance[] = yield* call(fetchTokenBalancesForAddress, address)
  return tokenBalances.filter((token) => token.balance !== '0').length > 0
}

export function* watchImportBackupPhrase() {
  yield* takeLeading(Actions.IMPORT_BACKUP_PHRASE, safely(importBackupPhraseSaga))
}

export function* importSaga() {
  yield* spawn(watchImportBackupPhrase)
}
