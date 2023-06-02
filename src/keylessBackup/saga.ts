import { GoogleSignin, User } from '@react-native-google-signin/google-signin'
import { call, put, spawn, takeLeading } from 'redux-saga/effects'
import { GOOGLE_OAUTH_CLIENT_ID } from 'src/config'
import {
  googleSignInCompleted,
  googleSignInFailed,
  googleSignInStarted,
} from 'src/keylessBackup/slice'
import Logger from 'src/utils/Logger'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { KeylessBackupEvents } from 'src/analytics/Events'
import { getTorusPrivateKey } from 'src/keylessBackup/torus'

const TAG = 'keylessBackupSaga'

export function* handleGoogleSignInStarted() {
  try {
    GoogleSignin.configure({ webClientId: GOOGLE_OAUTH_CLIENT_ID })
    // signOut so no saved sessions are used. This is important on Android as
    // otherwise this just succeeds with a screen flash and doesn't ask for the
    // Google account to be used
    yield call([GoogleSignin, 'signOut'])
    // Ensures play services is available on Android: https://github.com/react-native-google-signin/google-signin#hasplayservicesoptions
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

function* handleGoogleSignInCompleted({
  payload: { idToken: jwt },
}: ReturnType<typeof googleSignInCompleted>) {
  Logger.debug(TAG, 'handleGoogleSignInCompleted called with jwt', jwt)
  ValoraAnalytics.track(KeylessBackupEvents.sign_in_with_google_completed)

  // TODO navigate to next step in cloud backup/recovery flow

  Logger.debug(TAG, 'Exchanging Google id token for Torus private key')
  const torusPrivateKey = yield call(getTorusPrivateKey, {
    verifier: 'android-google-verifier', // TODO get from config
    jwt,
  })

  Logger.debug(TAG, 'Torus private key', torusPrivateKey)

  // TODO store Torus pk in wallet
}

function* watchGoogleSignInCompleted() {
  yield takeLeading(googleSignInCompleted.type, handleGoogleSignInCompleted)
}

export function* keylessBackupSaga() {
  yield spawn(watchGoogleSignInStarted)
  yield spawn(watchGoogleSignInCompleted)
}
