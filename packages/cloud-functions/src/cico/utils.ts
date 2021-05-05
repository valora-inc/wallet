import * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import { bigQueryDataset, bigQueryProjectId, getBigQueryInstance } from '../bigQuery'

const bigQuery = getBigQueryInstance()

export interface UserDeviceInfo {
  id: string
  appVersion: string
  userAgent: string
}

interface UserInitData {
  ipAddress: string
  timestamp: string
  userAgent: string
}

export const getUserInitData = async (
  currentIpAddress: string,
  deviceId: string,
  userAgent: string
): Promise<UserInitData> => {
  const [data] = await bigQuery.query(`
    SELECT context_ip, device_info_user_agent, timestamp
    FROM ${bigQueryProjectId}.${bigQueryDataset}.app_launched
    WHERE user_address = (
        SELECT user_address
        FROM ${bigQueryProjectId}.${bigQueryDataset}.app_launched
        WHERE device_info_unique_id= "${deviceId}"
        AND user_address IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 1
    )
    ORDER BY timestamp ASC
    LIMIT 1
  `)

  if (!data.length) {
    return {
      ipAddress: currentIpAddress,
      timestamp: new Date().toISOString(),
      userAgent,
    }
  }

  const { context_ip, device_info_user_agent, timestamp } = data[0]

  const userInitData = {
    ipAddress: context_ip,
    timestamp: timestamp.value,
    userAgent: device_info_user_agent,
  }

  return userInitData
}

export const getOrCreateUuid = async (userAddress: string) => {
  let simplexId = await admin
    .database()
    .ref(`registrations/${userAddress}/simplexId`)
    .once('value')
    .then((snapshot) => snapshot.val())

  if (simplexId) {
    return simplexId
  }

  simplexId = uuidv4()
  await admin.database().ref(`registrations/${userAddress}`).update({ simplexId })

  return simplexId
}

export function getFirebaseAdminCreds(localAdmin: any) {
  if (!process.env.GCLOUD_PROJECT) {
    try {
      const serviceAccount = require('../../config/serviceAccountKey.json')
      return localAdmin.credential.cert(serviceAccount)
    } catch (error) {
      console.error(
        'Error: Could not initialize admin credentials. Is serviceAccountKey.json missing?',
        error
      )
    }
  } else {
    try {
      return localAdmin.credential.applicationDefault()
    } catch (error) {
      console.error('Error: Could not retrieve default app creds', error)
    }
  }
}

export const fetchWithTimeout = async (
  url: string,
  body: any | null,
  duration: number
): Promise<Response | undefined> => {
  try {
    // @ts-ignore
    const timeout = new Promise<undefined>((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(Error(`Request timed out after ${duration}ms`))
      }, duration)
    })

    return Promise.race([body ? fetch(url, body) : fetch(url), timeout])
  } catch (error) {
    throw error
  }
}
