import * as admin from 'firebase-admin'
import { getFirebaseAdminCreds } from './cico/utils'

if (process.env.NODE_ENV !== 'test') {
  const gcloudProject = process.env.GCLOUD_PROJECT
  admin.initializeApp({
    credential: getFirebaseAdminCreds(admin),
    databaseURL: `https://${gcloudProject}.firebaseio.com`,
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

export async function fetchFromFirebase(path: string) {
  const snapshot = await database().ref(path).once('value')
  return snapshot.val()
}

export async function updateFirebase(path: string, value: any) {
  database()
    .ref(path)
    .set(value)
    .then(() => {
      console.info(`Updated value in ${path}`)
    })
    .catch((err) => {
      console.error(`There was an unexpected error while updating ${path}`, err)
    })
}
