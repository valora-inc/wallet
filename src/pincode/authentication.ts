/**
 * Logic and utilities for managing account secrets
 * The pincode is a short numeric string the user is required to enter
 * The pepper is a generated once per account and stored in the keychain/keystore
 * The password is a combination of the two. It is used for unlocking the account in the keychain
 */

import * as Keychain from '@divvi/react-native-keychain'
import crypto from 'crypto'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AuthenticationEvents, OnboardingEvents } from 'src/analytics/Events'
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
import { isValidAddress, normalizeAddress } from 'src/utils/address'
import { ensureError } from 'src/utils/ensureError'
import { sleep } from 'src/utils/sleep'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { getKeychainAccounts } from 'src/web3/contracts'
import { call, select } from 'typed-redux-saga'
import { sha256 } from 'viem'

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
export const CANCELLED_PIN_INPUT = 'CANCELLED_PIN_INPUT'
export const BIOMETRY_VERIFICATION_DELAY = 800

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
      const randomBytes = crypto.randomBytes(PEPPER_LENGTH)
      const pepper = randomBytes.toString('hex')
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

// TODO: this existing implementation implies password is in hex (no '0x' prefix)
// but we should lift that restriction as it's too easy to misuse
function getPasswordHash(password: string): string {
  return sha256(Buffer.from(password, 'hex')).slice(2)
}

// for testing
export const _getPasswordHash = getPasswordHash

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

    AppAnalytics.track(AuthenticationEvents.get_pincode_start)
    const pin = await getPincode(withVerification)
    AppAnalytics.track(AuthenticationEvents.get_pincode_complete)
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
    AppAnalytics.track(OnboardingEvents.pin_never_set)
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
    AppAnalytics.track(AuthenticationEvents.get_pincode_with_biometry_start)
    const retrievedPin = await retrieveStoredItem(STORAGE_KEYS.PIN, {
      // only displayed on Android - would be displayed on iOS too if we allow
      // device pincode fallback
      authenticationPrompt: {
        title: i18n.t('unlockWithBiometryPrompt') ?? undefined,
      },
    })
    if (retrievedPin) {
      AppAnalytics.track(AuthenticationEvents.get_pincode_with_biometry_complete)
      setCachedPin(DEFAULT_CACHE_ACCOUNT, retrievedPin)
      // allow native biometry verification animation to run fully
      await sleep(BIOMETRY_VERIFICATION_DELAY)
      return retrievedPin
    }
    throw new Error('Failed to retrieve pin with biometry, recieved null value')
  } catch (error) {
    AppAnalytics.track(AuthenticationEvents.get_pincode_with_biometry_error)
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
    const accounts = await getKeychainAccounts()
    const oldPassword = await getPasswordForPin(oldPin)
    const newPassword = await getPasswordForPin(newPin)
    const updated = await accounts.updatePassphrase(account, oldPassword, newPassword)
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
    const accounts = await getKeychainAccounts()
    const result = await accounts.unlock(currentAccount, password, UNLOCK_DURATION)
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
