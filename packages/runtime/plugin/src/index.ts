import { ConfigPlugin, withPlugins } from '@expo/config-plugins'

import { withAndroidCameraBuildFix } from './withAndroidCameraBuildFix'
import { withAndroidUserAgent } from './withAndroidUserAgent'
import { withIosAppDelegateResetKeychain } from './withIosAppDelegateResetKeychain'
import { withIosUserAgent } from './withIosUserAgent'

/**
 * A config plugin for configuring `@mobilestack-xyz/runtime`
 */
const withMobileStackApp: ConfigPlugin<{ appName?: string }> = (config, props = {}) => {
  return withPlugins(config, [
    // iOS
    withIosAppDelegateResetKeychain,
    [withIosUserAgent, props],

    // Android
    withAndroidCameraBuildFix,
    [withAndroidUserAgent, props],
  ])
}

export default withMobileStackApp
