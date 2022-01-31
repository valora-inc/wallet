import * as Keychain from 'react-native-keychain'
import Logger from 'src/utils/Logger'

const TAG = 'storage/keychain'
// the user cancelled error strings are OS specific
const KEYCHAIN_USER_CANCELLED_ERRORS = ['user canceled the operation']

interface SecureStorage {
  key: string
  value: string
  options?: Keychain.Options
}

export function isUserCancelledError(error: Error) {
  return KEYCHAIN_USER_CANCELLED_ERRORS.some((userCancelledError) =>
    error.toString().toLowerCase().includes(userCancelledError)
  )
}

export async function storeItem({ key, value, options = {} }: SecureStorage) {
  try {
    const result = await Keychain.setGenericPassword('CELO', value, {
      service: key,
      accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
      rules: Keychain.SECURITY_RULES.NONE,
      ...options,
    })
    if (result === false) {
      throw new Error('Store result false')
    }
    return result
  } catch (error) {
    Logger.error(TAG, 'Error storing item', error, true, value)
    throw error
  }
}

export async function retrieveStoredItem(key: string) {
  try {
    const item = await Keychain.getGenericPassword({
      service: key,
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

export async function removeStoredItem(key: string) {
  try {
    return Keychain.resetGenericPassword({
      service: key,
    })
  } catch (error) {
    Logger.error(TAG, 'Error clearing item', error, true)
    throw error
  }
}
