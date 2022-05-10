import { sleep } from '@celo/utils/lib/async'
import firebase from '@react-native-firebase/app'
import { FirebaseDatabaseTypes } from '@react-native-firebase/database'
import { eventChannel } from 'redux-saga'
import {
  call,
  cancelled,
  put,
  select,
  spawn,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects'
import { handleUpdateAccountRegistration } from 'src/account/saga'
import { showError } from 'src/alert/actions'
import { Actions as AppActions } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FIREBASE_ENABLED, isE2EEnv } from 'src/config'
import { updateCeloGoldExchangeRateHistory } from 'src/exchange/actions'
import { exchangeHistorySelector, ExchangeRate, MAX_HISTORY_RETENTION } from 'src/exchange/reducer'
import { Actions, firebaseAuthorized } from 'src/firebase/actions'
import {
  checkInitialNotification,
  initializeAuth,
  initializeCloudMessaging,
  watchFirebaseNotificationChannel,
} from 'src/firebase/firebase'
import { setLanguage } from 'src/i18n/slice'
import Logger from 'src/utils/Logger'
import { getRemoteTime } from 'src/utils/time'
import { getAccount } from 'src/web3/saga'

const TAG = 'firebase/saga'
const EXCHANGE_RATES = 'exchangeRates'
const VALUE_CHANGE_HOOK = 'value'
const FIREBASE_CONNECT_RETRIES = 3

let firebaseAlreadyAuthorized = false
export function* waitForFirebaseAuth() {
  if (firebaseAlreadyAuthorized) {
    return
  }
  yield take(Actions.AUTHORIZED)
  firebaseAlreadyAuthorized = true
  return
}

function* initializeFirebase() {
  const address = yield call(getAccount)
  if (isE2EEnv) {
    // Return early if isE2EEnv === true and don't show banner
    return
  }
  if (!FIREBASE_ENABLED) {
    Logger.info(TAG, 'Firebase disabled')
    yield put(showError(ErrorMessages.FIREBASE_DISABLED))
    return
  }

  Logger.info(TAG, 'Firebase enabled')
  try {
    for (let i = 0; i < FIREBASE_CONNECT_RETRIES; i += 1) {
      try {
        const app = firebase.app()
        Logger.info(TAG, `Attempt ${i + 1} to initialize db ${app.options.databaseURL}`)

        yield call(initializeAuth, firebase, address)
        yield put(firebaseAuthorized())
        yield call(initializeCloudMessaging, firebase, address)
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
    yield put(showError(ErrorMessages.FIREBASE_FAILED))
  }
}

export function* syncLanguageSelection() {
  yield call(waitForFirebaseAuth)
  yield call(handleUpdateAccountRegistration)
}

export function* watchLanguage() {
  yield takeEvery(setLanguage.type, syncLanguageSelection)
}

function celoGoldExchangeRateHistoryChannel(lastTimeUpdated: number) {
  const errorCallback = (error: Error) => {
    Logger.warn(TAG, error.toString())
  }

  const now = Date.now()
  // timestamp + 1 is used because .startAt is inclusive
  const startAt = Math.max(lastTimeUpdated + 1, now - MAX_HISTORY_RETENTION)

  return eventChannel((emit: any) => {
    const singleItemEmitter = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      emit([snapshot.val()])
    }
    const listenForNewElements = (newElementsStartAt: number) => {
      firebase
        .database()
        .ref(`${EXCHANGE_RATES}/cGLD/cUSD`)
        .orderByChild('timestamp')
        .startAt(newElementsStartAt)
        .on('child_added', singleItemEmitter, errorCallback)
    }
    const fullListEmitter = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      const result: ExchangeRate[] = []
      snapshot.forEach((childSnapshot: FirebaseDatabaseTypes.DataSnapshot) => {
        result.push(childSnapshot.val())
        return undefined
      })
      if (result.length) {
        emit(result)
        listenForNewElements(result[result.length - 1].timestamp + 1)
      } else {
        listenForNewElements(startAt)
      }
    }

    firebase
      .database()
      .ref(`${EXCHANGE_RATES}/cGLD/cUSD`)
      .orderByChild('timestamp')
      .startAt(startAt)
      .once(VALUE_CHANGE_HOOK, fullListEmitter, errorCallback)
      .catch((error) => {
        Logger.error(TAG, 'Error while fetching exchange rates', error)
      })

    return () => {
      firebase.database().ref(`${EXCHANGE_RATES}/cGLD/cUSD`).off()
    }
  })
}

export function* subscribeToCeloGoldExchangeRateHistory() {
  yield call(waitForFirebaseAuth)
  const history = yield select(exchangeHistorySelector)
  const channel = yield call(celoGoldExchangeRateHistoryChannel, history.lastTimeUpdated)
  try {
    while (true) {
      const exchangeRates = yield take(channel)
      const now = yield getRemoteTime()
      yield put(updateCeloGoldExchangeRateHistory(exchangeRates, now))
    }
  } catch (error) {
    Logger.error(
      `${TAG}@subscribeToCeloGoldExchangeRateHistory`,
      'Failed to subscribe to celo gold exchange rate history',
      error
    )
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* firebaseSaga() {
  yield spawn(initializeFirebase)
  yield spawn(watchLanguage)
  yield spawn(subscribeToCeloGoldExchangeRateHistory)
  yield takeLatest(AppActions.APP_MOUNTED, watchFirebaseNotificationChannel)
  yield takeLatest(AppActions.APP_MOUNTED, checkInitialNotification)
}
