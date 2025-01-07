const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const escapeStringRegexp = require('escape-string-regexp')
const isE2E = process.env.CELO_TEST_CONFIG === 'e2e'

const root = path.resolve(__dirname)
const escapedRoot = escapeStringRegexp(root)
const blist = []
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts
const defaultAssetExts = require('metro-config/src/defaults/defaults').assetExts

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    unstable_allowRequireContext: true, // used to enable rendering of all app assets dynamically in debug assets screen
  },
  resolver: {
    assetExts: [...defaultAssetExts, 'txt'],
    blacklistRE: exclusionList(
      isE2E ? blist : blist.concat([RegExp(`${escapedRoot}\/e2e\/mocks/.*`)])
    ),
    extraNodeModules: {
      // This is the crypto module we want to use moving forward (unless something better comes up).
      // It is implemented natively using OpenSSL.
      crypto: require.resolve('react-native-quick-crypto'),
      fs: require.resolve('react-native-fs'),
    },
    sourceExts: isE2E ? ['e2e.ts', 'e2e.js'].concat(defaultSourceExts) : defaultSourceExts,
  },
  watchFolders: [root],
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
