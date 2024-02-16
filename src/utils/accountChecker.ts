import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { passwordHashStorageKey } from 'src/pincode/authentication'
import { RootState } from 'src/redux/reducers'
import { retrieveStoredItem } from 'src/storage/keychain'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { clearStoredAccounts } from 'src/web3/KeychainLock'
import { getWallet } from 'src/web3/contracts'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, select } from 'typed-redux-saga'

const TAG = 'utils/accountChecker'

export function* checkAccountExistenceSaga() {
  const wallet = yield* call(getWallet)
  if (!wallet) {
    return
  }
  const keychainAccounts: string[] = yield wallet.getAccounts()
  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress && keychainAccounts.length > 0) {
    const account = keychainAccounts[0]
    ValoraAnalytics.track(AppEvents.redux_keychain_mismatch, {
      account,
    })
    const language = yield* select(currentLanguageSelector)
    if (!language) {
      navigateClearingStack(Screens.Language, { nextScreen: Screens.StoreWipeRecoveryScreen })
    } else {
      navigateClearingStack(Screens.StoreWipeRecoveryScreen)
    }
  }
}

// This function ensures the stored account in redux has a matching password hash in the system keychain/keystore
// so we can actually use the account private key
// If it's not in sync, the keychain/keystore has been wiped and there's nothing we can do about it.
// This happens when restoring the app data from iCloud backups. This is by design as we don't want the keychain data to be backed up.
// In that case we reset the redux state so the user can restore their account by entering the seed phrase or creating a new one.
//
// Note: this function is meant to be used before the redux state has been rehydrated.
// With the way the app init is currently done, this was the less disruptive place.
// I tried adding this to checkAccountExistenceSaga above, but it was causing issues because of sagas initializing in parallel.
export async function resetStateOnInvalidStoredAccount(state: RootState | undefined) {
  try {
    const walletAddress = state && walletAddressSelector(state)
    Logger.info(TAG, `Stored wallet address: ${walletAddress}`)
    if (walletAddress) {
      let passwordHash
      let keychainError: string | undefined
      try {
        passwordHash = await retrieveStoredItem(passwordHashStorageKey(walletAddress))
      } catch (err) {
        const error = ensureError(err).message
        Logger.warn(TAG, `Failed to retrieve password hash for ${walletAddress}: ${error}`)
        keychainError = error
      }
      if (!passwordHash) {
        // No password hash present, we need to reset the redux state and remove existing accounts from the keychain
        // which we can't unlock without the password hash
        ValoraAnalytics.track(AppEvents.redux_no_matching_keychain_account, {
          walletAddress,
          keychainError,
        })
        await clearStoredAccounts()
        Logger.info(TAG, `State reset`)
        return undefined
      }
    }
  } catch (error) {
    Logger.error(TAG, 'Failed to validate stored account', error)
  }

  return state
}
