import {
  googleSignInCompleted,
  keylessBackupFailed,
  keylessBackupStarted,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { call, put, spawn, takeLeading } from 'typed-redux-saga'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/saga'

export function* handleKeylessBackupStarted({ payload }: ReturnType<typeof keylessBackupStarted>) {
  // TODO(ACT-684?): Implement backup/restore flow
}

export function* handleGoogleSignInCompleted({
  payload: { idToken: jwt },
}: ReturnType<typeof googleSignInCompleted>) {
  // Note: this is done async while the user verifies their phone number.
  try {
    const torusPrivateKey = yield* call(getTorusPrivateKey, { verifier: 'valora-auth0', jwt })
    yield* put(torusKeyshareIssued({ keyshare: torusPrivateKey }))
  } catch (error) {
    Logger.error(TAG, 'Error getting Torus private key from auth0 jwt', error)
    yield* put(keylessBackupFailed()) // this just updates state for now. when the user reaches the
    // KeylessBackupProgress screen (after phone verification), they will see the failure UI
  }
}

function* watchKeylessBackupStarted() {
  yield* takeLeading(keylessBackupStarted.type, handleKeylessBackupStarted)
}

function* watchGoogleSignInCompleted() {
  yield* takeLeading(googleSignInCompleted.type, handleGoogleSignInCompleted)
}

export function* keylessBackupSaga() {
  yield* spawn(watchKeylessBackupStarted)
  yield* spawn(watchGoogleSignInCompleted)
}
