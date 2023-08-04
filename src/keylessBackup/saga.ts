import {
  googleSignInCompleted,
  keylessBackupStarted,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { call, put, spawn, takeLeading } from 'typed-redux-saga'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'

export function* handleKeylessBackupStarted({ payload }: ReturnType<typeof keylessBackupStarted>) {
  // TODO(ACT-684?): Implement backup/restore flow
}

export function* handleGoogleSignInCompleted({
  payload: { idToken: jwt },
}: ReturnType<typeof googleSignInCompleted>) {
  const torusPrivateKey = yield* call(getTorusPrivateKey, { verifier: 'valora-auth0', jwt })
  yield* put(torusKeyshareIssued({ keyshare: torusPrivateKey }))
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
