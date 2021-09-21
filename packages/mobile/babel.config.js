module.exports = {
  plugins: [
    [require('@babel/plugin-proposal-decorators').default, { legacy: true }],
    [
      'module:react-native-dotenv',
      {
        path: 'e2e/.env',
      },
    ],
    'react-native-reanimated/plugin',
    // NOTE: Reanimated plugin has to be listed last.
  ],
  presets: ['module:metro-react-native-babel-preset'],
}
