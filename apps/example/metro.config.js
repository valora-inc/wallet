// TODO: this is a temporary config until we have a custom preset for the runtime
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    // Needed otherwise we get import issues because of all the cyclic imports we currently have
    inlineRequires: true,
  },
})

config.resolver.assetExts = [...config.resolver.assetExts, 'txt']

module.exports = config
