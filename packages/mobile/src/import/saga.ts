import {
  formatNonAccentedCharacters,
  generateKeys,
  validateMnemonic,
} from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import * as bip39 from 'react-native-bip39'
import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { setBackupCompleted } from 'src/account/actions'
import { uploadNameAndPicture } from 'src/account/profileInfo'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { storeMnemonic } from 'src/backup/utils'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  ImportBackupPhraseAction,
  importBackupPhraseFailure,
  importBackupPhraseSuccess,
} from 'src/import/actions'
import { redeemInviteSuccess } from 'src/invite/actions'
import { navigate, navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { assignAccountFromPrivateKey, waitWeb3LastBlock } from 'src/web3/saga'

const TAG = 'import/saga'

export function* importBackupPhraseSaga({ phrase, useEmptyWallet }: ImportBackupPhraseAction) {
  Logger.debug(TAG + '@importBackupPhraseSaga', 'Importing backup phrase')
  yield call(waitWeb3LastBlock)
  try {
    const mnemonic = formatNonAccentedCharacters(phrase)
    if (!validateMnemonic(mnemonic, bip39)) {
      Logger.error(TAG + '@importBackupPhraseSaga', 'Invalid mnemonic')
      yield put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      yield put(importBackupPhraseFailure())
      return
    }

    const keys = yield call(generateKeys, mnemonic, undefined, undefined, undefined, bip39)
    const privateKey = keys.privateKey
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    if (!useEmptyWallet) {
      Logger.debug(TAG + '@importBackupPhraseSaga', 'Checking account balance')
      const backupAccount = privateKeyToAddress(privateKey)

      const dollarBalance: BigNumber = yield call(
        fetchTokenBalanceInWeiWithRetry,
        Currency.Dollar,
        backupAccount
      )

      const goldBalance: BigNumber = yield call(
        fetchTokenBalanceInWeiWithRetry,
        Currency.Celo,
        backupAccount
      )

      if (dollarBalance.isLessThanOrEqualTo(0) && goldBalance.isLessThanOrEqualTo(0)) {
        yield put(importBackupPhraseSuccess())
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
    // Set redeem invite complete so user isn't brought back into nux flow
    yield put(redeemInviteSuccess())
    yield put(refreshAllBalances())
    try {
      yield call(uploadNameAndPicture)
    } catch (error) {
      // The error is logged by uploadNameAndPicture, but we don't want to interrupt the flow if it fails.
      // TODO: Add some retry mechanism.
    }

    const recoveringFromStoreWipe = yield select(recoveringFromStoreWipeSelector)
    if (recoveringFromStoreWipe) {
      ValoraAnalytics.track(AppEvents.redux_store_recovery_success, { account })
    }

    navigateClearingStack(Screens.VerificationEducationScreen)

    yield put(importBackupPhraseSuccess())
  } catch (error) {
    Logger.error(TAG + '@importBackupPhraseSaga', 'Error importing backup phrase', error)
    yield put(showError(ErrorMessages.IMPORT_BACKUP_FAILED))
    yield put(importBackupPhraseFailure())
  }
}

export function* watchImportBackupPhrase() {
  yield takeLeading(Actions.IMPORT_BACKUP_PHRASE, importBackupPhraseSaga)
}

export function* importSaga() {
  yield spawn(watchImportBackupPhrase)
}
