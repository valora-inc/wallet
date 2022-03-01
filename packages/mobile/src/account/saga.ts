import firebase from '@react-native-firebase/app'
import _ from 'lodash'
import {
  call,
  cancelled,
  select,
  put,
  spawn,
  take,
  takeEvery,
  takeLeading,
} from 'redux-saga/effects'
import {
  Actions,
  ClearStoredAccountAction,
  initializeAccountSuccess,
  updateCusdDailyLimit,
  updatePersonaKycStatus,
  setFinclusiveKyc,
} from 'src/account/actions'
import { uploadNameAndPicture } from 'src/account/profileInfo'
import { FinclusiveKycStatus, PersonaKycStatus } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { clearStoredMnemonic } from 'src/backup/utils'
import { FIREBASE_ENABLED } from 'src/config'
import {
  cUsdDailyLimitChannel,
  firebaseSignOut,
  personaKycStatusChannel,
} from 'src/firebase/firebase'
import { deleteNodeData } from 'src/geth/geth'
import { refreshAllBalances } from 'src/home/actions'
import { getFinclusiveComplianceStatus, verifyDekAndMTW } from 'src/in-house-liquidity'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { removeAccountLocally } from 'src/pincode/authentication'
import { persistor } from 'src/redux/store'
import { restartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getMTWAddress, getOrCreateAccount, getWalletAddress } from 'src/web3/saga'
import { dataEncryptionKeySelector } from 'src/web3/selectors'
import { finclusiveKycStatusSelector } from './selectors'

const TAG = 'account/saga'

export const SENTINEL_MIGRATE_COMMENT = '__CELO_MIGRATE_TX__'

function* clearStoredAccountSaga({ account, onlyReduxState }: ClearStoredAccountAction) {
  try {
    if (!onlyReduxState) {
      yield call(removeAccountLocally, account)
      yield call(clearStoredMnemonic)
      yield call(ValoraAnalytics.reset)
      yield call(deleteNodeData)

      // Ignore error if it was caused by Firebase.
      try {
        yield call(firebaseSignOut, firebase.app())
      } catch (error) {
        if (FIREBASE_ENABLED) {
          Logger.error(TAG + '@clearStoredAccount', 'Failed to sign out from Firebase', error)
        }
      }
    }

    yield call(persistor.flush)
    yield call(restartApp)
  } catch (error) {
    Logger.error(TAG + '@clearStoredAccount', 'Error while removing account', error)
    yield put(showError(ErrorMessages.ACCOUNT_CLEAR_FAILED))
  }
}

function* initializeAccount() {
  Logger.debug(TAG + '@initializeAccount', 'Creating account')
  try {
    ValoraAnalytics.track(OnboardingEvents.initialize_account_start)
    yield call(getOrCreateAccount)
    yield put(refreshAllBalances())
    Logger.debug(TAG + '@initializeAccount', 'Account creation success')
    ValoraAnalytics.track(OnboardingEvents.initialize_account_complete)
    yield put(initializeAccountSuccess())
  } catch (e) {
    Logger.error(TAG, 'Failed to initialize account', e)
    ValoraAnalytics.track(OnboardingEvents.initialize_account_error, { error: e.message })
    navigateClearingStack(Screens.AccounSetupFailureScreen)
  }
}

export function* fetchFinclusiveKyc() {
  try {
    const accountMTWAddress = yield call(getMTWAddress)
    const dekPrivate = yield select(dataEncryptionKeySelector)

    const complianceStatus = yield call(
      getFinclusiveComplianceStatus,
      verifyDekAndMTW({ dekPrivate, accountMTWAddress })
    )
    yield put(setFinclusiveKyc(complianceStatus))
  } catch (error) {
    Logger.error(`${TAG}@fetchFinclusiveKyc`, 'Failed to fetch finclusive KYC', error)
  }
}

export function* watchDailyLimit() {
  const account = yield call(getWalletAddress)
  const channel = yield call(cUsdDailyLimitChannel, account)
  if (!channel) {
    return
  }
  try {
    while (true) {
      const dailyLimit = yield take(channel)
      if (_.isNumber(dailyLimit)) {
        yield put(updateCusdDailyLimit(dailyLimit))
      } else {
        Logger.warn(`${TAG}@watchDailyLimit`, 'Daily limit must be a number', dailyLimit)
      }
    }
  } catch (error) {
    Logger.error(`${TAG}@watchDailyLimit`, 'Failed to watch daily limit', error)
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* watchPersonaKycStatus() {
  const mtwAddress = yield call(getMTWAddress)
  const channel = yield call(personaKycStatusChannel, mtwAddress)

  if (!channel) {
    return
  }
  try {
    while (true) {
      const personaKycStatus = yield take(channel)
      if (
        personaKycStatus === undefined ||
        Object.values(PersonaKycStatus).includes(personaKycStatus)
      ) {
        yield put(updatePersonaKycStatus(personaKycStatus))
        const finclusiveKycStatus = yield select(finclusiveKycStatusSelector)
        if (
          personaKycStatus === PersonaKycStatus.Approved &&
          finclusiveKycStatus !== FinclusiveKycStatus.Accepted
        ) {
          yield call(fetchFinclusiveKyc)
        }
      } else {
        Logger.warn(
          `${TAG}@watchPersonaKycStatus`,
          'Persona KYC status is invalid or non-existant',
          personaKycStatus
        )
      }
    }
  } catch (error) {
    Logger.error(`${TAG}@watchPersonaKycStatus`, 'Failed to update KYC status', error)
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* watchClearStoredAccount() {
  const action = yield take(Actions.CLEAR_STORED_ACCOUNT)
  yield call(clearStoredAccountSaga, action)
}

export function* watchInitializeAccount() {
  yield takeLeading(Actions.INITIALIZE_ACCOUNT, initializeAccount)
}

export function* watchSaveNameAndPicture() {
  yield takeEvery(Actions.SAVE_NAME_AND_PICTURE, uploadNameAndPicture)
}

export function* watchFetchFinclusiveKYC() {
  yield takeLeading(Actions.FETCH_FINCLUSIVE_KYC, fetchFinclusiveKyc)
}

export function* accountSaga() {
  yield spawn(watchClearStoredAccount)
  yield spawn(watchInitializeAccount)
  yield spawn(watchSaveNameAndPicture)
  yield spawn(watchDailyLimit)
  yield spawn(watchPersonaKycStatus)
  yield spawn(registerAccountDek)
  yield spawn(watchFetchFinclusiveKYC)
}
