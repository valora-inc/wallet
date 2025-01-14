import { ConfigPlugin, withPlugins } from '@expo/config-plugins'

import { withAndroidCameraBuildFix } from './withAndroidCameraBuildFix'

/**
 * A config plugin for configuring `@mobilestack-xyz/runtime`
 */
const withMobileStackApp: ConfigPlugin = (config) => {
  return withPlugins(config, [
    // Android
    withAndroidCameraBuildFix,
  ])
}

export default withMobileStackApp
