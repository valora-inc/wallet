import { ContractKit } from '@celo/contractkit'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { UnlockableWallet } from '@celo/wallet-base'
import firebase from '@react-native-firebase/app'
import _ from 'lodash'
import DeviceInfo from 'react-native-device-info'
import {
  call,
  cancelled,
  put,
  select,
  spawn,
  take,
  takeEvery,
  takeLeading,
} from 'redux-saga/effects'
import {
  Actions,
  ClearStoredAccountAction,
  initializeAccountSuccess,
  saveSignedMessage,
  setFinclusiveKyc,
  updateCusdDailyLimit,
  updateKycStatus,
} from 'src/account/actions'
import { uploadNameAndPicture } from 'src/account/profileInfo'
import { FinclusiveKycStatus, KycStatus } from 'src/account/reducer'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { clearStoredMnemonic } from 'src/backup/utils'
import { FIREBASE_ENABLED } from 'src/config'
import { cUsdDailyLimitChannel, firebaseSignOut, kycStatusChannel } from 'src/firebase/firebase'
import { deleteNodeData } from 'src/geth/geth'
import { refreshAllBalances } from 'src/home/actions'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { getFinclusiveComplianceStatus, verifyWalletAddress } from 'src/in-house-liquidity'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import {
  removeAccountLocally,
  retrieveSignedMessage,
  storeSignedMessage,
} from 'src/pincode/authentication'
import { persistor } from 'src/redux/store'
import { restartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getOrCreateCapsuleAccount, getWalletAddress, unlockAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
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
    yield call(getOrCreateCapsuleAccount)
    yield call(generateSignedMessage)
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
    const walletAddress = yield call(getWalletAddress)

    const complianceStatus = yield call(
      getFinclusiveComplianceStatus,
      verifyWalletAddress({ walletAddress })
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

export function* watchKycStatus() {
  const walletAddress = yield call(getWalletAddress)
  const channel = yield call(kycStatusChannel, walletAddress)

  if (!channel) {
    return
  }
  try {
    while (true) {
      const kycStatus = yield take(channel)
      if (kycStatus === undefined || Object.values(KycStatus).includes(kycStatus)) {
        yield put(updateKycStatus(kycStatus))
        const finclusiveKycStatus = yield select(finclusiveKycStatusSelector)
        if (
          kycStatus === KycStatus.Approved &&
          finclusiveKycStatus !== FinclusiveKycStatus.Accepted
        ) {
          yield call(fetchFinclusiveKyc)
        }
      } else {
        Logger.warn(`${TAG}@watchKycStatus`, 'KYC status is invalid or non-existant', kycStatus)
      }
    }
  } catch (error) {
    Logger.error(`${TAG}@watchKycStatus`, 'Failed to update KYC status', error)
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* generateSignedMessage() {
  try {
    const wallet: UnlockableWallet = yield call(getWallet)
    const address: string = yield select(walletAddressSelector)
    yield call(unlockAccount, address)

    const kit: ContractKit = yield call(getContractKit)
    const chainId = yield call([kit.connection, 'chainId'])
    const payload: EIP712TypedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
        Message: [{ name: 'content', type: 'string' }],
      },
      domain: {
        name: 'Valora',
        version: '1',
        chainId,
      },
      message: {
        content: 'valora auth message',
      },
      primaryType: 'Message',
    }
    const signedTypedMessage = yield call([wallet, 'signTypedData'], address, payload)

    yield call(storeSignedMessage, signedTypedMessage)
    yield put(saveSignedMessage())
  } catch (error) {
    throw error
  }
}

export function* handleUpdateAccountRegistration() {
  const signedMessage = yield call(retrieveSignedMessage)
  if (!signedMessage) {
    // ensures backwards compatibility - this should happen only for updating the
    // fcm token when an existing user updates the app and the signed message is
    // not yet generated
    Logger.warn(
      `${TAG}@handleUpdateAccountRegistration`,
      'Tried to update account registration without signed message'
    )
    return
  }

  const address = yield select(walletAddressSelector)
  const appVersion = DeviceInfo.getVersion()
  const language = yield select(currentLanguageSelector)
  const country = yield select(userLocationDataSelector)

  let fcmToken
  try {
    fcmToken = yield call([firebase.app().messaging(), 'getToken'])
  } catch (error) {
    Logger.error(`${TAG}@handleUpdateAccountRegistration`, 'Could not get fcm token', error)
  }

  try {
    yield call(updateAccountRegistration, address, signedMessage, {
      appVersion,
      ...(language && { language }),
      ...(country?.countryCodeAlpha2 && { country: country?.countryCodeAlpha2 }),
      ...(fcmToken && { fcmToken }),
    })
  } catch (error) {
    Logger.error(
      `${TAG}@handleUpdateAccountRegistration`,
      'Unable to update account registration',
      error
    )
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

export function* watchSignedMessage() {
  yield take(Actions.SAVE_SIGNED_MESSAGE)
  yield call(handleUpdateAccountRegistration)
}

export function* accountSaga() {
  yield spawn(watchClearStoredAccount)
  yield spawn(watchInitializeAccount)
  yield spawn(watchSaveNameAndPicture)
  yield spawn(watchDailyLimit)
  yield spawn(watchKycStatus)
  yield spawn(registerAccountDek)
  yield spawn(watchFetchFinclusiveKYC)
  yield spawn(watchSignedMessage)
}
