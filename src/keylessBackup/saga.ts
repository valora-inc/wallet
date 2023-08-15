import {
  googleSignInCompleted,
  keylessBackupFailed,
  keylessBackupStarted,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { call, delay, put, select, spawn, takeLeading } from 'typed-redux-saga'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import Logger from 'src/utils/Logger'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { getSecp256K1KeyPair } from 'src/keylessBackup/encryption'

const TAG = 'keylessBackup/saga'

const DELAY_INTERVAL_MS = 500 // how long to wait between checks for keyshares
const WAIT_FOR_KEYSHARES_TIMEOUT_MS = 25 * 1000 // how long to wait for keyshares before failing

export function* handleKeylessBackupStarted({ payload }: ReturnType<typeof keylessBackupStarted>) {
  if (payload.keylessBackupFlow === KeylessBackupFlow.Setup) {
    yield* handleKeylessBackupSetup()
  } else {
    Logger.error(TAG, 'Unsupported keyless backup flow', payload.keylessBackupFlow)
    yield* put(keylessBackupFailed())
  }
}

export function* handleKeylessBackupSetup() {
  try {
    const { torusKeyshare, valoraKeyshare } = yield* waitForIssuedKeyshares()
    const { publicKey: encryptionAddress } = yield* call(getSecp256K1KeyPair, [
      Buffer.from(torusKeyshare, 'hex'),
      Buffer.from(valoraKeyshare, 'hex'),
    ])
    // TODO get encrypted mnemonic using encryptPassphrase
    // TODO post encrypted mnemonic to cloud-account-backup service
  } catch (error) {
    Logger.error(TAG, 'Error handling keyless backup setup', error)
    yield* put(keylessBackupFailed())
    return
  }
}

export function* waitForIssuedKeyshares() {
  const startTime = Date.now()
  let torusKeyshare: string | null = null
  let valoraKeyshare: string | null = null
  while (
    Date.now() - startTime < WAIT_FOR_KEYSHARES_TIMEOUT_MS &&
    !torusKeyshare &&
    !valoraKeyshare
  ) {
    torusKeyshare = yield* select((state) => state.keylessBackup.torusKeyshare)
    valoraKeyshare = yield* select((state) => state.keylessBackup.valoraKeyshare)
    if (!torusKeyshare || !valoraKeyshare) {
      yield* delay(DELAY_INTERVAL_MS)
    }
  }
  if (!torusKeyshare || !valoraKeyshare) {
    throw new Error(
      `Timed out waiting for keyshares. torusKeyshare obtained: ${!!torusKeyshare}, valoraKeyshare obtained: ${!!valoraKeyshare}`
    )
  }
  return { torusKeyshare, valoraKeyshare }
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
