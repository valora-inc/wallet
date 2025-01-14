import { ConfigPlugin, withPlugins } from '@expo/config-plugins'

import { withAndroidCameraBuildFix } from './withAndroidCameraBuildFix'
import { withIosAppDelegateResetKeychain } from './withIosAppDelegateResetKeychain'

/**
 * A config plugin for configuring `@mobilestack-xyz/runtime`
 */
const withMobileStackApp: ConfigPlugin = (config) => {
  return withPlugins(config, [
    // iOS
    withIosAppDelegateResetKeychain,

    // Android
    withAndroidCameraBuildFix,
  ])
}

export default withMobileStackApp
