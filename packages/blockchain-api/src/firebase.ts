import * as admin from 'firebase-admin'
import { FIREBASE_DB, FIREBASE_PROJECT_ID, getFirebaseAdminCreds } from './config'
import { logger } from './logger'

/**
 * Initialize Firebase Admin SDK
 */
logger.info('Initializing Firebase')
admin.initializeApp({
  credential: getFirebaseAdminCreds(admin),
  databaseURL: FIREBASE_DB,
  projectId: FIREBASE_PROJECT_ID,
})

export const database = admin.database()
