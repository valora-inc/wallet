import { setAccountCreationTime } from 'src/account/actions'
import { generateSignedMessage } from 'src/account/saga'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { generateKeysFromMnemonic, storeMnemonic } from 'src/backup/utils'
import { clearPasswordCaches } from 'src/pincode/PasswordCache'
import {
  CANCELLED_PIN_INPUT,
  getPasswordSaga,
  retrieveSignedMessage,
} from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { MnemonicLanguages, MnemonicStrength, generateMnemonic } from 'src/utils/account'
import { privateKeyToAddress } from 'src/utils/address'
import { ensureError } from 'src/utils/ensureError'
import { Actions, SetAccountAction, setAccount } from 'src/web3/actions'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { getKeychainAccounts } from 'src/web3/contracts'
import { currentAccountSelector, walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, take } from 'typed-redux-saga'
import { RootState } from '../redux/reducers'

const TAG = 'web3/saga'

export function* getOrCreateAccount() {
  const account = yield* select(currentAccountSelector)
  if (account) {
    Logger.debug(
      TAG + '@getOrCreateAccount',
      'Tried to create account twice, returning the existing one'
    )
    return account
  }

  let privateKey: string | undefined
  try {
    Logger.debug(TAG + '@getOrCreateAccount', 'Creating a new account')

    const mnemonicBitLength = MnemonicStrength.s128_12words
    const mnemonicLanguage = MnemonicLanguages.english
    let mnemonic: string = yield* call(generateMnemonic, mnemonicBitLength, mnemonicLanguage)

    // Ensure no duplicates in mnemonic
    const checkDuplicate = (someString: string) => {
      return new Set(someString.split(' ')).size !== someString.split(' ').length
    }
    let duplicateInMnemonic = checkDuplicate(mnemonic)
    while (duplicateInMnemonic) {
      Logger.debug(TAG + '@getOrCreateAccount', 'Regenerating mnemonic to avoid duplicates')
      mnemonic = yield* call(generateMnemonic, mnemonicBitLength, mnemonicLanguage)
      duplicateInMnemonic = checkDuplicate(mnemonic)
    }

    if (!mnemonic) {
      throw new Error('Failed to generate mnemonic')
    }

    const keys = yield* call(generateKeysFromMnemonic, mnemonic)
    privateKey = keys.privateKey
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    const accountAddress = yield* call(assignAccountFromPrivateKey, privateKey, mnemonic)
    if (!accountAddress) {
      throw new Error('Failed to assign account from private key')
    }

    yield* call(storeMnemonic, mnemonic, accountAddress)

    return accountAddress
  } catch (err) {
    const error = ensureError(err)
    const sanitizedError = Logger.sanitizeError(error, privateKey)
    Logger.error(TAG + '@getOrCreateAccount', 'Error creating account', sanitizedError)
    throw new Error(ErrorMessages.ACCOUNT_SETUP_FAILED)
  }
}

export function* assignAccountFromPrivateKey(privateKey: string, mnemonic: string) {
  try {
    const account = privateKeyToAddress(privateKey)
    const keychainAccounts = yield* call(getKeychainAccounts)
    const password: string = yield* call(getPasswordSaga, account, false, true)

    try {
      yield* call([keychainAccounts, keychainAccounts.addAccount], privateKey, password)
    } catch (err) {
      const e = ensureError(err)
      if (e.message === ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS) {
        Logger.warn(TAG + '@assignAccountFromPrivateKey', 'Attempted to import same account')
      } else {
        Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error importing raw key')
        throw e
      }

      yield* call([keychainAccounts, keychainAccounts.unlock], account, password, UNLOCK_DURATION)
    }

    Logger.debug(TAG + '@assignAccountFromPrivateKey', `Added to wallet: ${account}`)
    yield* put(setAccount(account))
    yield* put(setAccountCreationTime(Date.now()))
    return account
  } catch (e) {
    Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error assigning account', e)
    throw e
  }
}

/**
 * Get an address associated with the user account.
 *
 * Waits for the address to exist, then returns it.
 *
 * Used to help make getWalletAddress and getMTWAddress more DRY (since they are almost exactly the same).
 *
 * @param addressSelector
 * @param action
 */
function* getAddress<T extends { address: string | null }>({
  addressSelector,
  action,
}: {
  addressSelector: (state: RootState) => string | null
  action: Actions
}) {
  while (true) {
    const account = yield* select(addressSelector)
    if (account) {
      return account
    }

    const actionEffect = (yield* take(action)) as unknown as T
    if (actionEffect.address) {
      // account exists
      return actionEffect.address
    }
  }
}

// Wait for account to exist and then return it
export function* getWalletAddress() {
  const address = yield* getAddress<SetAccountAction>({
    addressSelector: walletAddressSelector,
    action: Actions.SET_ACCOUNT,
  })
  return address as string
}

// deprecated, please use |getWalletAddress| instead.
// This needs to be refactored and removed since the name is misleading.
export const getAccount = getWalletAddress

export type UnlockResultType = typeof UnlockResult
export enum UnlockResult {
  SUCCESS,
  FAILURE,
  CANCELED,
}

export type UnlockAccount = typeof unlockAccount
export function* unlockAccount(account: string, force: boolean = false) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)

  const keychainAccounts = yield* call(getKeychainAccounts)
  if (!force && keychainAccounts.isUnlocked(account)) {
    return UnlockResult.SUCCESS
  }

  try {
    const password: string = yield* call(getPasswordSaga, account)

    const result = yield* call(
      [keychainAccounts, keychainAccounts.unlock],
      account,
      password,
      UNLOCK_DURATION
    )
    if (!result) {
      throw new Error('Unlock account result false')
    }

    Logger.debug(TAG + '@unlockAccount', `Account unlocked: ${account}`)
    return UnlockResult.SUCCESS
  } catch (error) {
    if (error === CANCELLED_PIN_INPUT) {
      return UnlockResult.CANCELED
    }
    Logger.error(TAG + '@unlockAccount', 'Account unlock failed, clearing password caches', error)
    clearPasswordCaches()
    return UnlockResult.FAILURE
  }
}

// Wait for account ready
export function* getConnectedAccount() {
  const account: string = yield* call(getAccount)
  return account
}

// Wait for geth to be connected, geth ready, and get unlocked account
export function* getConnectedUnlockedAccount() {
  const account: string = yield* call(getConnectedAccount)
  const result: UnlockResult = yield* call(unlockAccount, account)
  if (result === UnlockResult.SUCCESS) {
    const signedMessage = yield* call(retrieveSignedMessage)
    if (!signedMessage) {
      try {
        yield* call(generateSignedMessage)
      } catch (error) {
        Logger.error(
          `${TAG}@getConnectedUnlockedAccount`,
          'Unable to generate signed message and update account registration',
          error
        )
      }
    }
    return account
  } else {
    throw new Error(
      result === UnlockResult.FAILURE
        ? ErrorMessages.INCORRECT_PIN
        : ErrorMessages.PIN_INPUT_CANCELED
    )
  }
}

export function* getAccountAddress() {
  return yield* call(getAccount)
}
