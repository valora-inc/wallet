import { sleep } from '@celo/utils/lib/async'
import firebase from '@react-native-firebase/app'
import { handleUpdateAccountRegistration } from 'src/account/saga'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Actions as AppActions } from 'src/app/actions'
import { FIREBASE_ENABLED, isE2EEnv } from 'src/config'
import { Actions, firebaseAuthorized } from 'src/firebase/actions'
import {
  checkInitialNotification,
  initializeAuth,
  initializeCloudMessaging,
  takeWithInMemoryCache,
  watchFirebaseNotificationChannel,
} from 'src/firebase/firebase'
import { setLanguage } from 'src/i18n/slice'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { getAccount } from 'src/web3/saga'
import { call, put, spawn, takeEvery, takeLatest } from 'typed-redux-saga'

const TAG = 'firebase/saga'
const FIREBASE_CONNECT_RETRIES = 3

export function* waitForFirebaseAuth() {
  yield takeWithInMemoryCache(Actions.AUTHORIZED)
}

export function* initializeFirebase() {
  const address = yield* call(getAccount)
  if (isE2EEnv) {
    // Return early if isE2EEnv === true and don't show banner
    return
  }
  if (!FIREBASE_ENABLED) {
    Logger.info(TAG, 'Firebase disabled')
    yield* put(showError(ErrorMessages.FIREBASE_DISABLED))
    return
  }

  Logger.info(TAG, 'Firebase enabled')
  try {
    for (let i = 0; i < FIREBASE_CONNECT_RETRIES; i += 1) {
      try {
        const app = firebase.app()
        Logger.info(TAG, `Attempt ${i + 1} to initialize db ${app.options.databaseURL}`)

        yield* call(initializeAuth, firebase, address)
        yield* put(firebaseAuthorized())
        yield* call(initializeCloudMessaging, firebase, address)
        Logger.info(TAG, `Firebase initialized`)

        return
      } catch (error) {
        if (i + 1 === FIREBASE_CONNECT_RETRIES) {
          throw error
        }

        yield sleep(2 ** i * 5000)
      }
    }
  } catch (error) {
    Logger.error(TAG, 'Error while initializing firebase', error)
    yield* put(showError(ErrorMessages.FIREBASE_FAILED))
  }
}

export function* syncLanguageSelection() {
  yield* call(waitForFirebaseAuth)
  yield* call(handleUpdateAccountRegistration)
}

export function* watchLanguage() {
  yield* takeEvery(setLanguage.type, safely(syncLanguageSelection))
}

export function* firebaseSaga() {
  yield* spawn(initializeFirebase)
  yield* spawn(watchLanguage)
  yield* takeLatest(AppActions.APP_MOUNTED, safely(watchFirebaseNotificationChannel))
  yield* takeLatest(AppActions.APP_MOUNTED, safely(checkInitialNotification))
}
