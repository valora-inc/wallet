const path = require('path')
const nodeLibs = require('node-libs-react-native')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const escapeStringRegexp = require('escape-string-regexp')
const isE2E = process.env.CELO_TEST_CONFIG === 'e2e'

const root = path.resolve(__dirname)
const escapedRoot = escapeStringRegexp(root)
const blist = []
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts
const defaultAssetExts = require('metro-config/src/defaults/defaults').assetExts

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        // This is important! We got a weird import error without it: `Error: Unknown named module: "tslib"`
        // See https://valora-app.slack.com/archives/C025V1D6F3J/p1652971548361499
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: [...defaultAssetExts, 'txt'],
    blacklistRE: exclusionList(
      isE2E ? blist : blist.concat([RegExp(`${escapedRoot}\/e2e\/mocks/.*`)])
    ),
    extraNodeModules: {
      ...nodeLibs,
      fs: require.resolve('react-native-fs'),
      'isomorphic-fetch': require.resolve('cross-fetch'),
      net: require.resolve('react-native-tcp'),
      vm: require.resolve('vm-browserify'),
    },
    sourceExts: isE2E ? ['e2e.ts', 'e2e.js'].concat(defaultSourceExts) : defaultSourceExts,
  },
  watchFolders: [root],
}
