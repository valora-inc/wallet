import AsyncStorage from '@react-native-async-storage/async-storage'
import Logger from 'src/utils/Logger'

const TAG = 'AsyncStoragePersistor'
/**
 * Persistor implementation using AsyncStorage
 * From https://github.com/segmentio/analytics-react-native/blob/master/packages/sovran/src/persistor/async-storage-persistor.ts
 *
 * This is almost exactly the same as the default persistor that segment uses however our build was not liking the persistor linked above due to its
 * use of require('@react-native-async-storage/async-storage'). The require was resolving to { default: AsynctStorage } instead of just AsyncStorage
 * so calls to AsyncStorage.getItem and AsyncStorage.setItem were not happening because they were undefined. This is a workaround to that issue.
 */
export const AsyncStoragePersistor = {
  get: async <T>(key: string): Promise<T | undefined> => {
    try {
      const persistedStateJSON = await AsyncStorage.getItem(key)
      if (persistedStateJSON !== null && persistedStateJSON !== undefined) {
        return JSON.parse(persistedStateJSON) as unknown as T
      }
    } catch (e) {
      Logger.error(TAG, 'Error getting async storage for segment persistor', e)
    }

    return undefined
  },

  set: async <T>(key: string, state: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(state))
    } catch (e) {
      Logger.error(TAG, 'Error setting async storage for segment persistor', e)
    }
  },
}
