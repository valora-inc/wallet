const path = require('path')
const nodeLibs = require('node-libs-react-native')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const escapeStringRegexp = require('escape-string-regexp')
const isE2E = process.env.CELO_TEST_CONFIG === 'e2e'

const cwd = path.resolve(__dirname)
const root = path.resolve(cwd, '../..')
const escapedRoot = escapeStringRegexp(root)
const blist = []
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts
const defaultAssetExts = require('metro-config/src/defaults/defaults').assetExts

module.exports = {
  resolver: {
    assetExts: [...defaultAssetExts, 'txt'],
    blacklistRE: exclusionList(
      isE2E ? blist : blist.concat([RegExp(`${escapedRoot}\/e2e\/mocks/.*`)])
    ),
    extraNodeModules: {
      ...nodeLibs,
      'crypto-js': path.resolve(cwd, 'node_modules/crypto-js'),
      fs: require.resolve('react-native-fs'),
      'isomorphic-fetch': require.resolve('cross-fetch'),
      net: require.resolve('react-native-tcp'),
      vm: require.resolve('vm-browserify'),
    },
    sourceExts: isE2E ? ['e2e.ts', 'e2e.js'].concat(defaultSourceExts) : defaultSourceExts,
  },
  watchFolders: [root],
}
