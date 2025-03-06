// Modified from https://github.com/mersiades/expo-router-branch-mre/blob/f56aae045e9a2f106bdd5f12176d6f98fda959a0/plugins/withCustomGradleProperties.js
// TODO: publish as an official expo config plugin
const { withGradleProperties } = require('@expo/config-plugins')

/**
 * Use this plugin to customize the gradle.properties file produced by Expo
 * @param {ExpoConfig} config
 * @param {Object.<string, string>} [properties] An object where each key-value pair represents a Gradle property
 * @return {ExpoConfig}
 */
module.exports = (config, properties = {}) => {
  return withGradleProperties(config, (config) => {
    Object.entries(properties).forEach(([key, value]) => {
      const property = { type: 'property', key, value }
      const index = config.modResults.findIndex((item) => item.key === key)

      if (index >= 0) {
        config.modResults[index] = property
      } else {
        config.modResults.push(property)
      }
    })

    return config
  })
}
