import { privateKeyToAddress } from '@celo/utils/lib/address'
import { initializeAccountSaga } from 'src/account/saga'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { generateKeysFromMnemonic, getStoredMnemonic, storeMnemonic } from 'src/backup/utils'
import { walletHasBalance } from 'src/import/saga'
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
  keylessBackupAcceptZeroBalance,
  keylessBackupBail,
  keylessBackupCompleted,
  keylessBackupFailed,
  keylessBackupNotFound,
  keylessBackupShowZeroBalance,
  torusKeyshareIssued,
  valoraKeyshareIssued,
} from 'src/keylessBackup/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { assignAccountFromPrivateKey } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, delay, put, race, select, spawn, take, takeLeading } from 'typed-redux-saga'
import { Hex, fromBytes } from 'viem'

const TAG = 'keylessBackup/saga'

export const DELAY_INTERVAL_MS = 500 // how long to wait between checks for keyshares
export const WAIT_FOR_KEYSHARE_TIMEOUT_MS = 25 * 1000 // how long to wait for keyshares before failing

export function* handleValoraKeyshareIssued({
  payload: { keylessBackupFlow, keyshare, jwt },
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
        jwt,
      })
    } else {
      yield* handleKeylessBackupRestore({
        torusKeyshareBuffer,
        valoraKeyshareBuffer,
        encryptionAddress,
        encryptionPrivateKey: fromBytes(encryptionPrivateKey, 'hex'),
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
  jwt,
}: {
  torusKeyshareBuffer: Buffer
  valoraKeyshareBuffer: Buffer
  encryptionAddress: string
  jwt: string
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
    jwt,
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
  encryptionPrivateKey: Hex
  encryptionAddress: string
}) {
  const encryptedMnemonic = yield* call(getEncryptedMnemonic, {
    encryptionPrivateKey,
    encryptionAddress,
  })

  if (!encryptedMnemonic) {
    ValoraAnalytics.track(KeylessBackupEvents.cab_restore_mnemonic_not_found)
    yield* put(keylessBackupNotFound())
    return
  }

  const decryptedMnemonic = yield* call(
    decryptPassphrase,
    torusKeyshareBuffer,
    valoraKeyshareBuffer,
    encryptedMnemonic
  )

  const { privateKey } = yield* call(generateKeysFromMnemonic, decryptedMnemonic)
  if (!privateKey) {
    throw new Error('Failed to convert mnemonic to hex')
  }
  const backupAccount = privateKeyToAddress(privateKey)
  if (!(yield* call(walletHasBalance, backupAccount))) {
    // show zero balance modal
    yield* put(keylessBackupShowZeroBalance())

    // wait for user to click continue or bail from keyless backup
    const [_continueAction, bailAction] = yield* race([
      take(keylessBackupAcceptZeroBalance.type),
      take(keylessBackupBail.type),
    ])
    if (bailAction) {
      navigate(Screens.ImportSelect)
      return
    }
  }

  const account: string | null = yield* call(
    assignAccountFromPrivateKey,
    privateKey,
    decryptedMnemonic
  )
  if (!account) {
    throw new Error('Failed to assign account from private key')
  }
  // Set key in phone's secure store
  yield* call(storeMnemonic, decryptedMnemonic, account)

  yield* call(initializeAccountSaga)

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
    const torusPrivateKey = yield* call(getTorusPrivateKey, { verifier: 'valora-cab-auth0', jwt })
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
