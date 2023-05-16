import { put, spawn, takeLeading } from 'redux-saga/effects'
import {
  googleSignInCompleted,
  googleSignInFailed,
  googleSignInStarted,
} from 'src/keylessBackup/slice'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackupSaga'

export function* handleGoogleSignInStarted() {
  try {
    // TODO: start sign in with google flow
    yield put(googleSignInCompleted({ idToken: 'dummy' }))
  } catch (err) {
    Logger.warn(TAG, 'Sign in with google failed', err)
    yield put(googleSignInFailed({ error: 'Sign in with google failed' }))
  }
}

function* watchGoogleSignInStarted() {
  yield takeLeading(googleSignInStarted.type, handleGoogleSignInStarted)
}

export function* keylessBackupSaga() {
  yield spawn(watchGoogleSignInStarted)
}
