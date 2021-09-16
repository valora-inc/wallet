import { DataSnapshot } from '@firebase/database-types'
import { database } from '../firebase'

const TAG = 'helpers/KnownAddressesCache'

const ROOT_KEY = 'addressesExtraInfo'

const ON_VALUE_CHANGED = 'value'

export class KnownAddressesCache {
  static knownAddresses: { [address: string]: { name?: string; imageUrl?: string } } = {}

  static startListening() {
    console.info(TAG, 'Starting listening to Firebase for new events')
    const onError = (error: Error) => {
      console.warn(TAG, error.toString())
    }

    const onValue = (snapshot: DataSnapshot) => {
      const value = snapshot.val()
      console.debug(TAG, `Got value from Firebase: ${JSON.stringify(value)}`)
      this.knownAddresses = value
    }

    database.ref(ROOT_KEY).on(ON_VALUE_CHANGED, onValue, onError)
  }

  static getValueFor(address: string) {
    return this.knownAddresses[address]
  }
}
