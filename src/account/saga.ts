import { ContractKit } from '@celo/contractkit'
import { parsePhoneNumber } from '@celo/phone-utils'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { UnlockableWallet } from '@celo/wallet-base'
import firebase from '@react-native-firebase/app'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import {
  Actions,
  ClearStoredAccountAction,
  initializeAccountSuccess,
  saveSignedMessage,
} from 'src/account/actions'
import { choseToRestoreAccountSelector } from 'src/account/selectors'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerificationCompleted } from 'src/app/actions'
import { inviterAddressSelector } from 'src/app/selectors'
import { clearStoredMnemonic } from 'src/backup/utils'
import { FIREBASE_ENABLED } from 'src/config'
import { firebaseSignOut } from 'src/firebase/firebase'
import { refreshAllBalances } from 'src/home/actions'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { navigate, navigateClearingStack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import {
  Actions as OnboardingActions,
  UpdateStatsigAndNavigateAction,
} from 'src/onboarding/actions'
import {
  removeAccountLocally,
  retrieveSignedMessage,
  storeSignedMessage,
} from 'src/pincode/authentication'
import { persistor } from 'src/redux/store'
import { patchUpdateStatsigUser } from 'src/statsig'
import { restartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { clearStoredAccounts } from 'src/web3/KeychainLock'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import networkConfig from 'src/web3/networkConfig'
import { getOrCreateAccount, getWalletAddress, unlockAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, take, takeLeading } from 'typed-redux-saga'
const TAG = 'account/saga'

export const SENTINEL_MIGRATE_COMMENT = '__CELO_MIGRATE_TX__'

function* clearStoredAccountSaga({ account, onlyReduxState }: ClearStoredAccountAction) {
  try {
    if (!onlyReduxState) {
      yield* call(removeAccountLocally, account)
      yield* call(clearStoredMnemonic)
      yield* call(ValoraAnalytics.reset)
      yield* call(clearStoredAccounts)

      // Ignore error if it was caused by Firebase.
      try {
        yield* call(firebaseSignOut, firebase.app())
      } catch (error) {
        if (FIREBASE_ENABLED) {
          Logger.error(TAG + '@clearStoredAccount', 'Failed to sign out from Firebase', error)
        }
      }
    }

    yield* call(persistor.flush)
    yield* call(restartApp)
  } catch (error) {
    Logger.error(TAG + '@clearStoredAccount', 'Error while removing account', error)
    yield* put(showError(ErrorMessages.ACCOUNT_CLEAR_FAILED))
  }
}

export function* initializeAccountSaga() {
  Logger.debug(TAG + '@initializeAccountSaga', 'Creating account')
  try {
    ValoraAnalytics.track(OnboardingEvents.initialize_account_start)
    yield* call(getOrCreateAccount)
    yield* call(generateSignedMessage)
    yield* put(refreshAllBalances())

    const choseToRestoreAccount = yield* select(choseToRestoreAccountSelector)
    if (choseToRestoreAccount) {
      yield* call(handlePreviouslyVerifiedPhoneNumber)
    }

    Logger.debug(TAG + '@initializeAccountSaga', 'Account creation success')
    yield* put(initializeAccountSuccess())
    const inviterAddress = yield* select(inviterAddressSelector)
    ValoraAnalytics.track(OnboardingEvents.initialize_account_complete, {
      inviterAddress,
    })
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, 'Failed to initialize account', error)
    ValoraAnalytics.track(OnboardingEvents.initialize_account_error, { error: error.message })
    navigateClearingStack(Screens.AccounSetupFailureScreen)
  }
}

function* handlePreviouslyVerifiedPhoneNumber() {
  const address = yield* select(walletAddressSelector)

  try {
    const signedMessage = yield* call(retrieveSignedMessage)
    const queryParams = new URLSearchParams({
      clientPlatform: Platform.OS,
      clientVersion: DeviceInfo.getVersion(),
    }).toString()

    const response = yield* call(fetch, `${networkConfig.lookupAddressUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora ${address}:${signedMessage}`,
      },
    })

    const result = yield* call([response, 'json'])
    if (response.ok && result.data?.phoneNumbers) {
      // if phoneNumbers length is 0, there are no verified numbers so do nothing
      if (result.data.phoneNumbers.length > 0) {
        const lastVerifiedNumber = result.data.phoneNumbers[result.data.phoneNumbers.length - 1]
        const phoneDetails = yield* call(parsePhoneNumber, lastVerifiedNumber)
        if (phoneDetails) {
          yield* put(
            phoneNumberVerificationCompleted(
              phoneDetails.e164Number,
              phoneDetails.countryCode ? `+${phoneDetails.countryCode}` : null
            )
          )
        } else {
          throw new Error('Could not parse verified phone number')
        }
      }
    } else {
      throw new Error(yield* call([response, 'text']))
    }
  } catch (error) {
    Logger.warn(
      `${TAG}@importBackupPhraseSaga`,
      `Failed to lookup and store verified phone numbers for this wallet address`,
      error
    )
  }
}

export function* generateSignedMessage() {
  try {
    const wallet: UnlockableWallet = yield* call(getWallet)
    const address = yield* select(walletAddressSelector)
    if (!address) {
      throw new Error('No address found')
    }
    yield* call(unlockAccount, address)

    const kit: ContractKit = yield* call(getContractKit)
    const chainId = yield* call([kit.connection, 'chainId'])
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
    const signedTypedMessage = yield* call([wallet, 'signTypedData'], address, payload)

    yield* call(storeSignedMessage, signedTypedMessage)
    yield* put(saveSignedMessage())
  } catch (error) {
    throw error
  }
}

export function* handleUpdateAccountRegistration() {
  const signedMessage = yield* call(retrieveSignedMessage)
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

  const address = yield* select(walletAddressSelector)
  const appVersion = DeviceInfo.getVersion()
  const language = yield* select(currentLanguageSelector)
  const country = yield* select(userLocationDataSelector)

  let fcmToken
  try {
    const isEmulator = yield* call([DeviceInfo, 'isEmulator'])
    // Emulators can't handle fcm tokens and calling getToken on them will throw an error
    if (!isEmulator) {
      fcmToken = yield* call([firebase.app().messaging(), 'getToken'])
    }
  } catch (error) {
    Logger.error(`${TAG}@handleUpdateAccountRegistration`, 'Could not get fcm token', error)
  }

  try {
    yield* call(updateAccountRegistration, address, signedMessage, {
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

export function* updateStatsigAndNavigate(action: UpdateStatsigAndNavigateAction) {
  // Wait for wallet address to exist before updating statsig user
  yield* call(getWalletAddress)
  yield* call(patchUpdateStatsigUser)
  if (action.screen === Screens.TabHome) {
    navigateHome()
  } else {
    navigate(action.screen)
  }
}

export function* watchUpdateStatsigAndNavigate() {
  yield* takeLeading(
    OnboardingActions.UPDATE_STATSIG_AND_NAVIGATE,
    safely(updateStatsigAndNavigate)
  )
}

export function* watchClearStoredAccount() {
  const action = (yield* take(Actions.CLEAR_STORED_ACCOUNT)) as ClearStoredAccountAction
  yield* call(clearStoredAccountSaga, action)
}

export function* watchInitializeAccount() {
  yield* takeLeading(Actions.INITIALIZE_ACCOUNT, safely(initializeAccountSaga))
}

export function* watchSignedMessage() {
  yield* take(Actions.SAVE_SIGNED_MESSAGE)
  yield* call(handleUpdateAccountRegistration)
}

export function* accountSaga() {
  yield* spawn(watchUpdateStatsigAndNavigate)
  yield* spawn(watchClearStoredAccount)
  yield* spawn(watchInitializeAccount)
  yield* spawn(registerAccountDek)
  yield* spawn(watchSignedMessage)
}
