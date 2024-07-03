/**
 * Logic and utilities for managing account secrets
 * The pincode is a short numeric string the user is required to enter
 * The pepper is a generated once per account and stored in the keychain/keystore
 * The password is a combination of the two. It is used for unlocking the account in the keychain
 */

import { isValidAddress, normalizeAddress } from '@celo/utils/lib/address'
import { sleep } from '@celo/utils/lib/async'
import { sha256 } from 'ethereumjs-util'
import * as Keychain from 'react-native-keychain'
import { generateSecureRandom } from 'react-native-securerandom'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { AuthenticationEvents, OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getStoredMnemonic, storeMnemonic } from 'src/backup/utils'
import i18n from 'src/i18n'
import { storedPasswordRefreshed } from 'src/identity/actions'
import { shouldRefreshStoredPasswordHashSelector } from 'src/identity/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  clearPasswordCaches,
  getCachedPassword,
  getCachedPasswordHash,
  getCachedPepper,
  getCachedPin,
  setCachedPassword,
  setCachedPasswordHash,
  setCachedPepper,
  setCachedPin,
} from 'src/pincode/PasswordCache'
import { store } from 'src/redux/store'
import {
  isUserCancelledError,
  removeStoredItem,
  retrieveStoredItem,
  storeItem,
} from 'src/storage/keychain'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { getWalletAsync } from 'src/web3/contracts'
import { call, select } from 'typed-redux-saga'

const PIN_BLOCKLIST = require('src/pincode/pin-blocklist-hibpv7-top-25k-with-keyboard-translations.json')

const TAG = 'pincode/authentication'

enum STORAGE_KEYS {
  PEPPER = 'PEPPER',
  PASSWORD_HASH = 'PASSWORD_HASH',
  PIN = 'PIN',
  SIGNED_MESSAGE = 'SIGNED_MESSAGE',
}

const PEPPER_LENGTH = 64
export const PIN_LENGTH = 6
// Pepper and pin not currently generalized to be per account
// Using this value in the caches
export const DEFAULT_CACHE_ACCOUNT = 'default'
export const DEK = 'DEK'
export const CANCELLED_PIN_INPUT = 'CANCELLED_PIN_INPUT'
export const BIOMETRY_VERIFICATION_DELAY = 800

/**
 * Pin blocklist that loads from the bundle resources a pre-configured list and allows it to be
 * searched to determine if a given PIN should be allowed.
 *
 * @remarks Blocklist format is a sorted list of blocked 6-digit PINs, each encoded as their
 * big-endian numeric representation, truncated to 3-bytes. When bundled as a resource, this binary
 * structure is base64 encoded and formatted as JSON string literal.
 */
export class PinBlocklist {
  private readonly buffer: Buffer

  constructor() {
    this.buffer = Buffer.from(PIN_BLOCKLIST, 'base64')
  }

  public size(): number {
    return Math.floor(this.buffer.length / 3)
  }

  public contains(pin: string): boolean {
    // Parse the provided 6-digit PIN into an integer in the range [1000000, 0].
    const target = parseInt(pin)
    if (isNaN(target) || target > 1e6 || target < 0 || target % 1 !== 0) {
      throw new Error('failed to parse integer from blocklist search PIN')
    }

    // Recursively defined binary search in the sorted blocklist.
    const search = (blocklist: Buffer, target: number): boolean => {
      if (blocklist.length === 0) {
        return false
      }

      const blocklistSize = Math.floor(blocklist.length / 3)
      const middle = Math.floor(blocklistSize / 2)
      const pivot = Buffer.concat([
        Buffer.from([0]),
        blocklist.slice(middle * 3, (middle + 1) * 3),
      ]).readUInt32BE(0)

      if (target === pivot) {
        return true
      }

      if (target < pivot) {
        return search(blocklist.slice(0, middle * 3), target)
      } else {
        return search(blocklist.slice((middle + 1) * 3), target)
      }
    }

    return search(this.buffer, target)
  }
}

const DEPRECATED_PIN_BLOCKLIST = [
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
]

export function isPinValid(pin: string) {
  return /^\d{6}$/.test(pin) && !DEPRECATED_PIN_BLOCKLIST.includes(pin)
}

export async function retrieveOrGeneratePepper(account = DEFAULT_CACHE_ACCOUNT) {
  if (!getCachedPepper(account)) {
    let storedPepper = await retrieveStoredItem(STORAGE_KEYS.PEPPER)
    if (!storedPepper) {
      Logger.debug(TAG, 'No stored pepper, generating new pepper and storing it to the keychain')
      const randomBytes = await generateSecureRandom(PEPPER_LENGTH)
      const pepper = Buffer.from(randomBytes).toString('hex')
      await storeItem({ key: STORAGE_KEYS.PEPPER, value: pepper })
      storedPepper = pepper
    }
    setCachedPepper(account, storedPepper)
  }
  return getCachedPepper(account)!
}

async function getPasswordForPin(pin: string) {
  const pepper = await retrieveOrGeneratePepper()
  const password = `${pepper}${pin}`
  return password
}

async function getPasswordHashForPin(pin: string) {
  const password = await getPasswordForPin(pin)
  return getPasswordHash(password)
}

function getPasswordHash(password: string) {
  return sha256(Buffer.from(password, 'hex')).toString('hex')
}

export function passwordHashStorageKey(account: string) {
  if (!isValidAddress(account)) {
    throw new Error('Expecting valid address for computing storage key')
  }
  return `${STORAGE_KEYS.PASSWORD_HASH}-${normalizeAddress(account)}`
}

function storePasswordHash(hash: string, account: string) {
  setCachedPasswordHash(account, hash)
  return storeItem({ key: passwordHashStorageKey(account), value: hash })
}

function storePinWithBiometry(pin: string) {
  return storeItem({
    key: STORAGE_KEYS.PIN,
    value: pin,
    options: {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
    },
  })
}

export async function storeSignedMessage(message: string) {
  return storeItem({
    key: STORAGE_KEYS.SIGNED_MESSAGE,
    value: message,
    options: {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  })
}

export async function retrieveSignedMessage() {
  return retrieveStoredItem(STORAGE_KEYS.SIGNED_MESSAGE)
}

export function removeStoredPin() {
  return removeStoredItem(STORAGE_KEYS.PIN)
}

async function retrievePasswordHash(account: string) {
  if (!getCachedPasswordHash(account)) {
    let hash: string | null = null
    try {
      hash = await retrieveStoredItem(passwordHashStorageKey(account))
    } catch (err) {
      Logger.error(`${TAG}@retrievePasswordHash`, 'Error retrieving hash', err, true)
      return null
    }
    if (!hash) {
      Logger.warn(`${TAG}@retrievePasswordHash`, 'No password hash found in store')
      return null
    }
    setCachedPasswordHash(account, hash)
  }
  return getCachedPasswordHash(account)
}

let passwordLock = false
let lastPassword: string | null = null
let lastError: any = null

export async function getPassword(
  account: string,
  withVerification: boolean = true,
  storeHash: boolean = false
) {
  while (passwordLock) {
    await sleep(100)
    if (lastPassword) {
      return lastPassword
    }
    if (lastError) {
      throw lastError
    }
  }
  passwordLock = true
  try {
    let password = getCachedPassword(account)
    if (password) {
      passwordLock = false
      return password
    }

    ValoraAnalytics.track(AuthenticationEvents.get_pincode_start)
    const pin = await getPincode(withVerification)
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_complete)
    password = await getPasswordForPin(pin)

    if (storeHash) {
      const hash = getPasswordHash(password)
      await storePasswordHash(hash, account)
    }

    setCachedPassword(account, password)
    lastPassword = password
    return password
  } catch (error) {
    lastError = error
    throw error
  } finally {
    setTimeout(() => {
      passwordLock = false
      lastPassword = null
      lastError = null
    }, 500)
  }
}

export function* getPasswordSaga(account: string, withVerification?: boolean, storeHash?: boolean) {
  const pincodeType = yield* select(pincodeTypeSelector)

  if (pincodeType === PincodeType.Unset) {
    Logger.debug(TAG + '@getPincode', 'Pin has never been set')
    ValoraAnalytics.track(OnboardingEvents.pin_never_set)
    throw Error('Pin has never been set')
  }

  if (pincodeType !== PincodeType.CustomPin && pincodeType !== PincodeType.PhoneAuth) {
    throw new Error(`Unsupported Pincode Type ${pincodeType}`)
  }

  return yield* call(getPassword, account, withVerification, storeHash)
}

type PinCallback = (pin: string) => void

export async function setPincodeWithBiometry() {
  let pin = getCachedPin(DEFAULT_CACHE_ACCOUNT)
  if (!pin) {
    pin = await requestPincodeInput(true, true)
  }

  try {
    // storeItem can be called multiple times with the same key, so stale keys
    // from previous app installs/failed save attempts will be overwritten
    // safely here
    await storePinWithBiometry(pin)
    // allow native biometry verification animation to run fully
    await sleep(BIOMETRY_VERIFICATION_DELAY)
  } catch (error) {
    Logger.warn(TAG, 'Failed to save pin with biometry', error)
    throw error
  }
}

export async function getPincodeWithBiometry() {
  try {
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_biometry_start)
    const retrievedPin = await retrieveStoredItem(STORAGE_KEYS.PIN, {
      // only displayed on Android - would be displayed on iOS too if we allow
      // device pincode fallback
      authenticationPrompt: {
        title: i18n.t('unlockWithBiometryPrompt') ?? undefined,
      },
    })
    if (retrievedPin) {
      ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_biometry_complete)
      setCachedPin(DEFAULT_CACHE_ACCOUNT, retrievedPin)
      // allow native biometry verification animation to run fully
      await sleep(BIOMETRY_VERIFICATION_DELAY)
      return retrievedPin
    }
    throw new Error('Failed to retrieve pin with biometry, recieved null value')
  } catch (error) {
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_biometry_error)
    Logger.warn(TAG, 'Failed to retrieve pin with biometry', error)
    throw error
  }
}

// Retrieve the pincode value
// May trigger the pincode enter screen
export async function getPincode(withVerification = true) {
  const cachedPin = getCachedPin(DEFAULT_CACHE_ACCOUNT)
  if (cachedPin) {
    return cachedPin
  }

  const pincodeType = pincodeTypeSelector(store.getState())
  if (pincodeType === PincodeType.PhoneAuth) {
    try {
      const retrievedPin = await getPincodeWithBiometry()
      return retrievedPin
    } catch (err) {
      const error = ensureError(err)
      // do not return here, the pincode input is the user's fallback if
      // biometric auth fails
      if (!isUserCancelledError(error)) {
        Logger.warn(TAG, 'Failed to retrieve pin with biometry', error)
      }
    }
  }

  const pin = await requestPincodeInput(withVerification, true)
  return pin
}

// Navigate to the pincode enter screen and check pin
export async function requestPincodeInput(
  withVerification = true,
  shouldNavigateBack = true,
  account?: string
) {
  const pin = await new Promise((resolve: PinCallback, reject: (error: string) => void) => {
    navigate(Screens.PincodeEnter, {
      onSuccess: resolve,
      onCancel: () => reject(CANCELLED_PIN_INPUT),
      withVerification,
      account,
    })
  })

  if (shouldNavigateBack) {
    navigateBack()
  }

  if (!pin) {
    throw new Error('Pincode confirmation returned empty pin')
  }

  setCachedPin(DEFAULT_CACHE_ACCOUNT, pin)
  return pin
}

// Confirm pin is correct by checking it against the stored password hash
export async function checkPin(pin: string, account: string) {
  const shouldRefreshStoredPasswordHash = shouldRefreshStoredPasswordHashSelector(store.getState())

  const hashForPin = await getPasswordHashForPin(pin)
  const correctHash = await retrievePasswordHash(account)

  if (!correctHash || shouldRefreshStoredPasswordHash) {
    Logger.warn(`${TAG}@checkPin`, 'Validating pin without stored password hash')
    const password = await getPasswordForPin(pin)
    const unlocked = await ensureCorrectPassword(password, account)
    if (unlocked) {
      await storePasswordHash(hashForPin, account)
      store.dispatch(storedPasswordRefreshed())

      return true
    }
    return false
  }

  return hashForPin === correctHash
}

export async function updatePin(account: string, oldPin: string, newPin: string) {
  try {
    const wallet = await getWalletAsync()
    const oldPassword = await getPasswordForPin(oldPin)
    const newPassword = await getPasswordForPin(newPin)
    const updated = await wallet.updateAccount(account, oldPassword, newPassword)
    if (updated) {
      clearPasswordCaches()
      setCachedPin(DEFAULT_CACHE_ACCOUNT, newPin)
      const hash = getPasswordHash(newPassword)
      await storePasswordHash(hash, account)
      const pincodeType = pincodeTypeSelector(store.getState())
      if (pincodeType === PincodeType.PhoneAuth) {
        await storePinWithBiometry(newPin)
      }
      const phrase = await getStoredMnemonic(account, oldPassword)
      if (phrase) {
        await storeMnemonic(phrase, account, newPassword)
      } else {
        throw new Error("Couldn't find stored mnemonic")
      }
      return true
    }
  } catch (error) {
    Logger.error(`${TAG}@updatePin`, 'Error updating pin', error)
    return false
  }
}

// Confirm password by actually attempting to unlock the account
export async function ensureCorrectPassword(
  password: string,
  currentAccount: string
): Promise<boolean> {
  try {
    const wallet = await getWalletAsync()
    const result = await wallet.unlockAccount(currentAccount, password, UNLOCK_DURATION)
    return result
  } catch (error) {
    Logger.error(TAG, 'Error attempting to unlock wallet', error, true)
    Logger.showError(
      i18n.t(ErrorMessages.ACCOUNT_UNLOCK_FAILED) ?? new Error('Error attempting to unlock wallet')
    )
    return false
  }
}

export async function removeAccountLocally(account: string) {
  clearPasswordCaches()
  return Promise.all([
    removeStoredItem(STORAGE_KEYS.PEPPER),
    removeStoredItem(passwordHashStorageKey(account)),
    removeStoredItem(STORAGE_KEYS.PIN),
    removeStoredItem(STORAGE_KEYS.SIGNED_MESSAGE),
  ])
}
