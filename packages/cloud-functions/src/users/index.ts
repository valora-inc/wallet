import * as functions from 'firebase-functions'
import { database } from '../firebase'

// Lift the daily limit for now
export const onWriteUserAddress = functions.database
  .ref('users/{uid}/address')
  .onWrite(async (change, context) => {
    const { uid } = context.params
    // Exit when the data is deleted.
    if (!change.after.exists()) {
      return
    }
    const address = change.after.val()
    if (typeof address !== 'string') {
      throw new Error(`Unexpected type for address: ${address}`)
    }
    console.info(`Setting daily limit for ${uid} ${address}`)
    await database().ref(`registrations/${address}/dailyLimitCusd`).set(Number.MAX_VALUE)
  })
