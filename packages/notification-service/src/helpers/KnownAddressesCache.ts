import { Database, DataSnapshot } from '@firebase/database-types'

const TAG = 'helpers/KnownAddressesCache'

const ROOT_KEY = 'addressesExtraInfo'

const ON_VALUE_CHANGED = 'value'

export interface DisplayInfo {
  name?: string
  imageUrl?: string
}

export default class KnownAddressesCache {
  private knownAddresses: {
    [address: string]: DisplayInfo | undefined
  } = {}

  startListening(database: Database): void {
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

  getDisplayInfoFor(address: string): DisplayInfo {
    return this.knownAddresses[address] ?? {}
  }
}
