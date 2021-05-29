import * as admin from 'firebase-admin'
import { getFirebaseAdminCreds } from './cico/utils'

if (process.env.NODE_ENV !== 'test') {
  const gcloudProject = process.env.GCLOUD_PROJECT
  admin.initializeApp({
    credential: getFirebaseAdminCreds(admin),
    databaseURL: gcloudProject
      ? `https://${gcloudProject}.firebaseio.com`
      : 'http://localhost:9000/?ns=celo-mobile-alfajores',
    projectId: gcloudProject,
  })
}

export function database() {
  return admin.database()
}

export function messaging() {
  return admin.messaging()
}

export function saveTxHashProvider(address: string, txHash: string, provider: string) {
  database()
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
