import { Linking, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { APP_STORE_ID, DEEP_LINK_URL_SCHEME } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'utils/linking'

export function navigateToWalletStorePage() {
  if (Platform.OS === 'android') {
    navigateToURI(`market://details?id=${DeviceInfo.getBundleId()}`)
  } else {
    navigateToURI(`https://apps.apple.com/app/id${APP_STORE_ID}`)
  }
}

export function isDeepLink(url: string): boolean {
  return url.startsWith(`${DEEP_LINK_URL_SCHEME}:`)
}

export function navigateToURI(uri: string, backupUri?: string) {
  Logger.debug(TAG, 'Navigating to URI', uri)

  // We're NOT using `Linking.canOpenURL` here because we would need
  // the scheme to be added to LSApplicationQueriesSchemes on iOS
  // which is not possible for arbitrary callbacks from other apps (DAppKit used to do this)
  Linking.openURL(uri).catch((reason) => {
    Logger.debug(TAG, 'URI not supported', uri)
    if (backupUri) {
      Logger.debug(TAG, 'Trying backup URI', backupUri)
      navigateToURI(backupUri)
    } else {
      Logger.error(TAG, `Error navigating to URI`, reason)
    }
  })
}

export function navigateToPhoneSettings() {
  Logger.debug(TAG, 'Navigating phone settings')
  Linking.openSettings().catch((reason) =>
    Logger.error(TAG, `Error navigating to phone settings`, reason)
  )
}
