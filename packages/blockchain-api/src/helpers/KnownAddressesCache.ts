import { DataSnapshot } from '@firebase/database-types'
import { database } from '../firebase'

const TAG = 'helpers/KnownAddressesCache'

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
    console.info(TAG, 'Start listening to Firebase for new events')

    const onError = (error: Error) => {
      console.warn(TAG, error.toString())
    }

    const onValue = (snapshot: DataSnapshot) => {
      const value = snapshot.val()
      console.info(TAG, `Got value from Firebase: ${JSON.stringify(value)}`)
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
