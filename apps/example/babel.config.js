module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            crypto: 'react-native-quick-crypto',
            stream: 'readable-stream',
            buffer: '@craftzdog/react-native-buffer',
            // Temporary hack so we can directly import from the @divvi/mobile package
            // without transpiling, we'll probably add a custom preset for this
            '^src/(.+)$': '../../node_modules/@divvi/mobile/src/\\1',
            '^locales$': '../../node_modules/@divvi/mobile/locales',
          },
        },
      ],
      'react-native-reanimated/plugin', // NOTE: this plugin MUST be last
    ],
  }
}
