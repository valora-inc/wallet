import { PrivateKeyStorage } from '../PrivateKeyStorage'
import Keychain from 'react-native-keychain'
import Logger from '../../utils/Logger'

const KEYCHAIN_USER_CANCELLED_ERRORS = [
  'user canceled the operation',
  'error: code: 13, msg: cancel',
  'error: code: 10, msg: fingerprint operation canceled by the user',
]

export function isUserCancelledError(error: Error) {
  return KEYCHAIN_USER_CANCELLED_ERRORS.some((userCancelledError) =>
    error.toString().toLowerCase().includes(userCancelledError)
  )
}

export async function storeItem(key: string, value: string, options: Keychain.Options = {}) {
  try {
    const result = await Keychain.setGenericPassword('@CAPSULE', value, {
      service: key,
      accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
      rules: Keychain.SECURITY_RULES.NONE,
      ...options,
    })
    if (result === false) {
      throw new Error('Store result false')
    }
  } catch (error) {
    Logger.error(TAG, 'Error storing item', error, true, value)
    throw error
  }
}

export async function retrieveStoredItem(key: string, options: Keychain.Options = {}) {
  try {
    const item = await Keychain.getGenericPassword({
      service: key,
      ...options,
    })
    if (!item) {
      return null
    }
    return item.password
  } catch (error) {
    if (!isUserCancelledError(error)) {
      // triggered when biometry verification fails and user cancels the action
      Logger.error(TAG, 'Error retrieving stored item', error, true)
    }
    throw error
  }
}

const TAG = '@CAPSULE/wallet-'

export class ReactNativePrivateKeyStorage extends PrivateKeyStorage {
  protected privateKeyGetOptions(): Keychain.Options {
    return {}
  }

  protected privateKeySetOptions(): Keychain.Options {
    return {}
  }

  async getPrivateKey(): Promise<string | null> {
    return await retrieveStoredItem(TAG + this.walletId, this.privateKeyGetOptions())
  }

  async setPrivateKey(key: string): Promise<void> {
    return await storeItem(TAG + this.walletId, key, this.privateKeySetOptions())
  }
}
