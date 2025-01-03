import { Platform } from 'react-native'
import { getAll, getMinimal, MinimalContact } from 'react-native-contacts'
import {
  check as checkPermission,
  RESULTS as PERMISSION_RESULTS,
  PERMISSIONS,
} from 'react-native-permissions'
import Logger from 'src/utils/Logger'

const TAG = 'utils/contacts'

export const CONTACTS_PERMISSION =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS

export async function hasGrantedContactsPermission() {
  const contactPermissionStatus = await checkPermission(CONTACTS_PERMISSION)
  return contactPermissionStatus === PERMISSION_RESULTS.GRANTED
}

// Stop gap solution since getMinimal is not yet implement on iOS
function customGetAll(callback: (error: any, contacts: MinimalContact[]) => void) {
  getAll((error, fullContacts) => {
    if (error) {
      callback(error, [])
      return
    }

    const minimalContacts = fullContacts
      .map(
        ({
          recordID,
          givenName,
          middleName,
          familyName,
          company,
          phoneNumbers,
          thumbnailPath,
        }): MinimalContact => ({
          recordID,
          displayName: [givenName, middleName, familyName].filter(Boolean).join(' ') || company,
          phoneNumbers,
          thumbnailPath,
        })
      )
      // some contacts are only email and number
      .filter((minimalContact) => !!minimalContact.displayName)

    callback(null, minimalContacts)
  })
}

export async function getAllContacts(): Promise<MinimalContact[] | null> {
  const contactPermissionStatusGranted = await hasGrantedContactsPermission()
  if (!contactPermissionStatusGranted) {
    Logger.warn(TAG, 'Permissions not given for retrieving contacts')
    return null
  }

  const getMethod = Platform.OS === 'android' ? getMinimal : customGetAll

  return new Promise((resolve, reject) => {
    getMethod((error, contacts) => {
      if (error) {
        Logger.error(TAG, 'Error getting all contacts', error)
        reject(error)
        return
      }

      if (!contacts) {
        Logger.error(TAG, 'Contacts is null')
        reject('Contacts is null')
        return
      }

      resolve(contacts)
    })
  })
}
