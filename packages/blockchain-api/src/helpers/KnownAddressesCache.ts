import { DataSnapshot } from '@firebase/database-types'
import { database } from '../firebase'
import { logger } from '../logger'

const ROOT_KEY = 'addressesExtraInfo'

const ON_VALUE_CHANGED = 'value'

export interface DisplayInfo {
  name?: string
  imageUrl?: string
}

class KnownAddressesCache {
  private knownAddresses: {
    [address: string]: DisplayInfo | undefined
  } = {}

  startListening(): void {
    const onError = (error: Error) => {
      logger.error({
        type: 'ERROR_FETCHING_KNOWN_ADDRESSES',
        error: error.message,
      })
    }

    const onValue = (snapshot: DataSnapshot) => {
      const value = snapshot.val()
      logger.info({ type: 'FETCHED_KNOWN_ADDRESSES' })
      this.knownAddresses = value ?? this.knownAddresses
    }

    database.ref(ROOT_KEY).on(ON_VALUE_CHANGED, onValue, onError)
  }

  getDisplayInfoFor(address: string): DisplayInfo {
    return this.knownAddresses[address] ?? {}
  }
}

export const knownAddressesCache = new KnownAddressesCache()
export default knownAddressesCache
