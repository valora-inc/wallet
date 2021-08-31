import { Permission, PermissionsAndroid } from 'react-native'
import { PRIVACY_LINK } from 'src/brandingConfig'
import i18n from 'src/i18n'
import Logger from 'src/utils/Logger'

const TAG = 'utils/permissions.android'

export async function requestContactsPermission() {
  return requestPermission(
    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    i18n.t('onboarding:contacts.disclosure.title'),
    i18n.t('onboarding:contacts.disclosure.body', { privacyLink: PRIVACY_LINK })
  )
}

export async function checkContactsPermission() {
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
}

async function requestPermission(permission: Permission, title?: string, message?: string) {
  try {
    const granted = await PermissionsAndroid.request(
      permission,
      title && message
        ? {
            title,
            message,
            buttonPositive: 'OK',
          }
        : undefined
    )

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Logger.debug(TAG + '@requestPermission', 'Permission granted for: ' + permission)
      return true
    } else {
      Logger.debug(TAG + '@requestPermission', 'Permission denied for: ' + permission)
      return false
    }
  } catch (err) {
    Logger.showError('Error requesting permisison: ' + permission)
    return false
  }
}
