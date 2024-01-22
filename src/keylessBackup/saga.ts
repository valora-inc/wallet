import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getStoredMnemonic } from 'src/backup/utils'
import {
  decryptPassphrase,
  encryptPassphrase,
  getSecp256K1KeyPair,
  getWalletAddressFromPrivateKey,
} from 'src/keylessBackup/encryption'
import { getEncryptedMnemonic, storeEncryptedMnemonic } from 'src/keylessBackup/index'
import { torusKeyshareSelector } from 'src/keylessBackup/selectors'
import {
  googleSignInCompleted,
  keylessBackupCompleted,
  keylessBackupFailed,
  torusKeyshareIssued,
  valoraKeyshareIssued,
} from 'src/keylessBackup/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, delay, put, select, spawn, takeLeading } from 'typed-redux-saga'

const TAG = 'keylessBackup/saga'

export const DELAY_INTERVAL_MS = 500 // how long to wait between checks for keyshares
export const WAIT_FOR_KEYSHARE_TIMEOUT_MS = 25 * 1000 // how long to wait for keyshares before failing

export function* handleValoraKeyshareIssued({
  payload: { keylessBackupFlow, keyshare },
}: ReturnType<typeof valoraKeyshareIssued>) {
  try {
    const torusKeyshare = yield* waitForTorusKeyshare()
    const torusKeyshareBuffer = Buffer.from(torusKeyshare, 'hex')
    const valoraKeyshareBuffer = Buffer.from(keyshare, 'hex')
    const { privateKey: encryptionPrivateKey } = yield* call(
      getSecp256K1KeyPair,
      torusKeyshareBuffer,
      valoraKeyshareBuffer
    )
    const encryptionAddress = getWalletAddressFromPrivateKey(encryptionPrivateKey)
    if (keylessBackupFlow === KeylessBackupFlow.Setup) {
      yield* handleKeylessBackupSetup({
        torusKeyshareBuffer,
        valoraKeyshareBuffer,
        encryptionAddress,
      })
    } else {
      yield* handleKeylessBackupRestore({
        torusKeyshareBuffer,
        valoraKeyshareBuffer,
        encryptionAddress,
        encryptionPrivateKey: Buffer.from(encryptionPrivateKey).toString('hex'),
      })
    }
    ValoraAnalytics.track(KeylessBackupEvents.cab_handle_keyless_backup_success, {
      keylessBackupFlow,
    })
  } catch (error) {
    Logger.error(TAG, `Error handling keyless backup ${keylessBackupFlow}`, error)
    ValoraAnalytics.track(KeylessBackupEvents.cab_handle_keyless_backup_failed, {
      keylessBackupFlow,
    })
    yield* put(keylessBackupFailed())
    return
  }
}

function* handleKeylessBackupSetup({
  torusKeyshareBuffer,
  valoraKeyshareBuffer,
  encryptionAddress,
}: {
  torusKeyshareBuffer: Buffer
  valoraKeyshareBuffer: Buffer
  encryptionAddress: string
}) {
  const walletAddress = yield* select(walletAddressSelector)
  const mnemonic = yield* call(getStoredMnemonic, walletAddress)
  if (!mnemonic) {
    throw new Error('No mnemonic found')
  }
  const encryptedMnemonic = yield* call(
    encryptPassphrase,
    torusKeyshareBuffer,
    valoraKeyshareBuffer,
    mnemonic
  )
  yield* call(storeEncryptedMnemonic, {
    encryptedMnemonic,
    encryptionAddress,
  })
  yield* put(keylessBackupCompleted())
}

function* handleKeylessBackupRestore({
  torusKeyshareBuffer,
  valoraKeyshareBuffer,
  encryptionPrivateKey,
  encryptionAddress,
}: {
  torusKeyshareBuffer: Buffer
  valoraKeyshareBuffer: Buffer
  encryptionPrivateKey: string
  encryptionAddress: string
}) {
  const encryptedMnemonic = yield* call(getEncryptedMnemonic, {
    encryptionPrivateKey,
    encryptionAddress,
  })

  // TODO(ACT-778): use mnemonic
  yield* call(decryptPassphrase, torusKeyshareBuffer, valoraKeyshareBuffer, encryptedMnemonic)
  yield* put(keylessBackupCompleted())
}

export function* waitForTorusKeyshare() {
  const startTime = Date.now()
  let torusKeyshare: string | null = yield* select(torusKeyshareSelector)
  while (!torusKeyshare && Date.now() - startTime < WAIT_FOR_KEYSHARE_TIMEOUT_MS) {
    yield* delay(DELAY_INTERVAL_MS)
    torusKeyshare = yield* select(torusKeyshareSelector)
  }
  if (!torusKeyshare) {
    ValoraAnalytics.track(KeylessBackupEvents.cab_torus_keyshare_timeout)
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
    ValoraAnalytics.track(KeylessBackupEvents.cab_get_torus_keyshare_failed)
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
