import { DataSnapshot } from '@firebase/database-types'
import { database } from '../firebase'

const TAG = 'helpers/KnownAddressesCache'

const ROOT_KEY = 'addressesExtraInfo'

const ON_VALUE_CHANGED = 'value'

class KnownAddressesCache {
  private knownAddresses: {
    [address: string]: { name?: string; imageUrl?: string } | undefined
  } = {}

  startListening(): void {
    console.info(TAG, 'Start listening to Firebase for new events')

    const onError = (error: Error) => {
      console.warn(TAG, error.toString())
    }

    const onValue = (snapshot: DataSnapshot) => {
      const value = snapshot.val()
      console.debug(TAG, `Got value from Firebase: ${JSON.stringify(value)}`)
      if (value) {
        this.knownAddresses = value
      }
    }

    database.ref(ROOT_KEY).on(ON_VALUE_CHANGED, onValue, onError)
  }

  getValueFor(address: string): { name?: string; imageUrl?: string } {
    const value = this.knownAddresses[address]
    if (!value) {
      return {}
    }

    return value
  }
}

export const knownAddressesCache = new KnownAddressesCache()
knownAddressesCache.startListening()

export default knownAddressesCache
