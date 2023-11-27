import Contacts from 'react-native-contacts'

/**
 * @deprecated use react-native-permissions
 */
export async function requestContactsPermission(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    Contacts.requestPermission((err, permission) => {
      if (err) {
        reject(err)
      } else {
        resolve(permission === 'authorized')
      }
    })
  })
}

/**
 * @deprecated use react-native-permissions
 */
export async function checkContactsPermission(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    Contacts.checkPermission((err, permission) => {
      if (err) {
        reject(err)
      } else {
        resolve(permission === 'authorized')
      }
    })
  })
}
