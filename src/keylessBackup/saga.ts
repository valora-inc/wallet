import { GoogleSignin, User } from '@react-native-google-signin/google-signin'
import { call, put, spawn, takeLeading } from 'redux-saga/effects'
import { GOOGLE_OAUTH_CLIENT_ID } from 'src/config'
import {
  googleSignInCompleted,
  googleSignInFailed,
  googleSignInStarted,
} from 'src/keylessBackup/slice'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackupSaga'

export function* handleGoogleSignInStarted() {
  try {
    GoogleSignin.configure({ webClientId: GOOGLE_OAUTH_CLIENT_ID })
    // signOut so no saved sessions are used. This is important on Android as
    // otherwise this just succeeds with a screen flash and doesn't ask for the
    // Google account to be used
    yield call([GoogleSignin, 'signOut'])
    yield call([GoogleSignin, 'hasPlayServices'])
    const { idToken }: User = yield call([GoogleSignin, 'signIn'])

    if (!idToken) {
      throw new Error('got null idToken from GoogleSignIn')
    }

    yield put(googleSignInCompleted({ idToken }))
  } catch (err) {
    Logger.warn(TAG, 'Sign in with google failed', err)
    yield put(googleSignInFailed())
  }
}

function* watchGoogleSignInStarted() {
  yield takeLeading(googleSignInStarted.type, handleGoogleSignInStarted)
}

export function* keylessBackupSaga() {
  yield spawn(watchGoogleSignInStarted)
}
