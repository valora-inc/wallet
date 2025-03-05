const { withPlugins } = require('@expo/config-plugins')

/**
 * Use this plugin to conditionally apply Detox plugin
 * @param {ExpoConfig} config
 * @return {ExpoConfig}
 */
module.exports = (config, properties = {}) => {
  // Only apply Detox plugin if E2E testing is enabled
  // Otherwise we'd get this error on Android, when running the app outside of the e2e environment:
  // `CLEARTEXT communication to [some host] not permitted by network security policy
  // See also https://github.com/expo/config-plugins/tree/main/packages/detox#yarn-e2eandroid-failed
  if (process.env.EXPO_PUBLIC_DIVVI_E2E === 'true') {
    return withPlugins(config, ['@config-plugins/detox'])
  }

  // Return unmodified config if E2E testing is disabled
  return config
}
