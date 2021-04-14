export function getFirebaseAdminCreds(admin: any) {
  if (!process.env.GCLOUD_PROJECT) {
    try {
      const serviceAccount = require('../serviceAccountKey.json')
      return admin.credential.cert(serviceAccount)
    } catch (error) {
      console.error(
        'Error: Could not initialize admin credentials. Is serviceAccountKey.json missing?',
        error
      )
    }
  } else {
    try {
      return admin.credential.applicationDefault()
    } catch (error) {
      console.error('Error: Could not retrieve default app creds', error)
    }
  }
}
