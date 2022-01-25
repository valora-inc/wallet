import * as Keychain from 'react-native-keychain'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'

const TAG = 'storage/keychain'

interface SecureStorage {
  key: string
  value: string
}

export async function storeItem({ key, value }: SecureStorage) {
  try {
    const result = await Keychain.setGenericPassword('CELO', value, {
      service: key,
      accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
      rules: Keychain.SECURITY_RULES.NONE,
    })
    if (result === false) {
      throw new Error('Store result false')
    }

    // check that we can correctly read the keychain before proceeding
    const retrievedResult = await retrieveStoredItem(key)
    if (retrievedResult !== value) {
      await removeStoredItem(key)
      Logger.error(`${TAG}@storeItem`, 'Retrieved value does not match stored value')
      throw new Error('Retrieved value does not match stored value')
    }

    return result
  } catch (error) {
    Logger.error(TAG, 'Error storing item', error, true, value)
    throw new Error(ErrorMessages.KEYCHAIN_STORAGE_ERROR)
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
    Logger.error(TAG, 'Error retrieving stored item', error, true)
    throw new Error(ErrorMessages.KEYCHAIN_STORAGE_ERROR)
  }
}

export async function removeStoredItem(key: string) {
  try {
    return Keychain.resetGenericPassword({
      service: key,
    })
  } catch (error) {
    Logger.error(TAG, 'Error clearing item', error, true)
    throw new Error(ErrorMessages.KEYCHAIN_STORAGE_ERROR)
  }
}
