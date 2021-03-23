import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp(functions.config().firebase)

export function saveTxHashProvider(address: string, txHash: string, provider: string) {
  admin
    .database()
    .ref(`/registrations/${address}/txHashes/${txHash}`)
    .set(provider)
    .then(() =>
      console.info(`Linked provider ${provider} to tx hash ${txHash} for address ${address}`)
    )
    .catch(() =>
      console.error(
        `ERROR while linking provider ${provider} to tx hash ${txHash} for address ${address}`
      )
    )
}
