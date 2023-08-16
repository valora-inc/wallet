import {
  googleSignInCompleted,
  keylessBackupCompleted,
  keylessBackupFailed,
  torusKeyshareIssued,
  valoraKeyshareIssued,
} from 'src/keylessBackup/slice'
import { call, delay, put, select, spawn, takeLeading } from 'typed-redux-saga'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import Logger from 'src/utils/Logger'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import {
  encryptPassphrase,
  getSecp256K1KeyPair,
  getWalletAddressFromPrivateKey,
} from 'src/keylessBackup/encryption'
import { getStoredMnemonic } from 'src/backup/utils'
import { walletAddressSelector } from 'src/web3/selectors'
import { storeEncryptedMnemonic } from 'src/keylessBackup/index'
import { torusKeyshareSelector } from 'src/keylessBackup/selectors'

const TAG = 'keylessBackup/saga'

export const DELAY_INTERVAL_MS = 500 // how long to wait between checks for keyshares
export const WAIT_FOR_KEYSHARE_TIMEOUT_MS = 25 * 1000 // how long to wait for keyshares before failing

export function* handleValoraKeyshareIssued({ payload }: ReturnType<typeof valoraKeyshareIssued>) {
  if (payload.keylessBackupFlow === KeylessBackupFlow.Setup) {
    yield* handleKeylessBackupSetup(payload.keyshare)
  } else {
    Logger.error(TAG, 'Unsupported keyless backup flow', payload.keylessBackupFlow)
    yield* put(keylessBackupFailed())
  }
}

export function* handleKeylessBackupSetup(valoraKeyshare: string) {
  Logger.debug(TAG, 'Handling keyless backup setup')
  try {
    const torusKeyshare = yield* waitForTorusKeyshare()
    const { privateKey } = yield* call(
      getSecp256K1KeyPair,
      Buffer.from(torusKeyshare, 'hex'),
      Buffer.from(valoraKeyshare, 'hex')
    )
    const encryptionAddress = getWalletAddressFromPrivateKey(privateKey)
    Logger.debug(TAG, 'Encryption address obtained')
    const walletAddress = yield* select(walletAddressSelector)
    const mnemonic = yield* call(getStoredMnemonic, walletAddress)
    if (!mnemonic) {
      throw new Error('No mnemonic found')
    }
    Logger.debug(TAG, 'Mnemonic obtained')
    const encryptedMnemonic = yield* call(
      encryptPassphrase,
      Buffer.from(torusKeyshare, 'hex'),
      Buffer.from(valoraKeyshare, 'hex'),
      mnemonic
    )
    Logger.debug(TAG, 'Mnemonic encrypted')
    Logger.debug(
      TAG,
      `encryptionAddressString: ${encryptionAddress}, encryptedMnemonic: ${encryptedMnemonic}`
    )
    yield* call(storeEncryptedMnemonic, {
      encryptedMnemonic,
      encryptionAddress,
    })
    Logger.debug(TAG, 'Encrypted mnemonic stored')
    yield* put(keylessBackupCompleted())
    Logger.debug(TAG, 'Keyless backup completed')
  } catch (error) {
    Logger.error(TAG, 'Error handling keyless backup setup', error)
    yield* put(keylessBackupFailed())
    return
  }
}

export function* waitForTorusKeyshare() {
  const startTime = Date.now()
  let torusKeyshare: string | null = yield* select(torusKeyshareSelector)
  while (!torusKeyshare && Date.now() - startTime < WAIT_FOR_KEYSHARE_TIMEOUT_MS) {
    yield* delay(DELAY_INTERVAL_MS)
    torusKeyshare = yield* select(torusKeyshareSelector)
  }
  if (!torusKeyshare) {
    throw new Error(`Timed out waiting for torus keyshare.`)
  }
  return torusKeyshare
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

function* watchGoogleSignInCompleted() {
  yield* takeLeading(googleSignInCompleted.type, handleGoogleSignInCompleted)
}

function* watchValoraKeyshareIssued() {
  yield* takeLeading(valoraKeyshareIssued.type, handleValoraKeyshareIssued)
}

export function* keylessBackupSaga() {
  yield* spawn(watchGoogleSignInCompleted)
  yield* spawn(watchValoraKeyshareIssued)
}
