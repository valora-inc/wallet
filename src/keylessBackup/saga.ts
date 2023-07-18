import { GoogleSignin, User } from '@react-native-google-signin/google-signin'
import { GOOGLE_OAUTH_CLIENT_ID } from 'src/config'
import {
  googleSignInCompleted,
  googleSignInFailed,
  googleSignInStarted,
} from 'src/keylessBackup/slice'
import Logger from 'src/utils/Logger'
import { call, put, spawn, takeLeading } from 'typed-redux-saga/macro'

const TAG = 'keylessBackupSaga'

export function* handleGoogleSignInStarted() {
  try {
    GoogleSignin.configure({ webClientId: GOOGLE_OAUTH_CLIENT_ID })
    // signOut so no saved sessions are used. This is important on Android as
    // otherwise this just succeeds with a screen flash and doesn't ask for the
    // Google account to be used
    yield* call([GoogleSignin, 'signOut'])
    // Ensures play services is available on Android: https://github.com/react-native-google-signin/google-signin#hasplayservicesoptions
    yield* call([GoogleSignin, 'hasPlayServices'])
    const { idToken }: User = yield* call([GoogleSignin, 'signIn'])

    if (!idToken) {
      throw new Error('got null idToken from GoogleSignIn')
    }

    yield* put(googleSignInCompleted({ idToken }))
  } catch (err) {
    Logger.warn(TAG, 'Sign in with google failed', err)
    yield* put(googleSignInFailed())
  }
}

function* watchGoogleSignInStarted() {
  yield* takeLeading(googleSignInStarted.type, handleGoogleSignInStarted)
}

export function* keylessBackupSaga() {
  yield* spawn(watchGoogleSignInStarted)
}
