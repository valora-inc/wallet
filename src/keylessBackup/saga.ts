import {
  googleSignInCompleted,
  keylessBackupFailed,
  keylessBackupStarted,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { call, put, spawn, takeLeading } from 'typed-redux-saga'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import Logger from 'src/utils/Logger'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

const TAG = 'keylessBackup/saga'

export function* handleKeylessBackupStarted({ payload }: ReturnType<typeof keylessBackupStarted>) {
  // TODO(ACT-684?): Implement backup/restore flow
}

function handleKeylessBackupFailed({ payload }: ReturnType<typeof keylessBackupFailed>) {
  navigate(Screens.KeylessBackupProgress, payload) // shows error if backupStatus is failed
}

export function* handleGoogleSignInCompleted({
  payload: { idToken: jwt, keylessBackupFlow },
}: ReturnType<typeof googleSignInCompleted>) {
  // Note: this is done async while the user verifies their phone number.
  //  The advantage of doing it this way is the user doesn't have to wait as long for their backup to complete once they
  //  finish phone verification.
  //  The disadvantage is if this fails, the user could be halfway through phone verification when we navigate to a
  //  failure screen, kinda weird.
  //  If this fails often, we should probably move this step to take place only after the user is done verifying their
  //  phone number and is seeing a spinner.
  try {
    const torusPrivateKey = yield* call(getTorusPrivateKey, { verifier: 'valora-auth0', jwt })
    yield* put(torusKeyshareIssued({ keyshare: torusPrivateKey }))
  } catch (error) {
    Logger.error(TAG, 'Error getting Torus private key from auth0 jwt', error)
    yield* put(keylessBackupFailed({ keylessBackupFlow }))
  }
}

function* watchKeylessBackupStarted() {
  yield* takeLeading(keylessBackupStarted.type, handleKeylessBackupStarted)
}

function* watchKeylessBackupFailed() {
  yield* takeLeading(keylessBackupFailed.type, handleKeylessBackupFailed)
}

function* watchGoogleSignInCompleted() {
  yield* takeLeading(googleSignInCompleted.type, handleGoogleSignInCompleted)
}

export function* keylessBackupSaga() {
  yield* spawn(watchKeylessBackupStarted)
  yield* spawn(watchGoogleSignInCompleted)
  yield* spawn(watchKeylessBackupFailed)
}
