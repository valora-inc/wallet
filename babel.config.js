let moduleResolverPluginConfig = []

if (!process.env.JEST_WORKER_ID) {
  // Jest has a resolution process for manual mocks (e.g., __mocks__/src) and
  // module-resolver conflicts with it. The result is imports resolve to the
  // non-mocked modules instead of the mocked ones. Jest also has it's own
  // resolution config (moduleNameMapper) so module-resolver is superfluous.
  moduleResolverPluginConfig[0] = [
    'module-resolver',
    {
      root: ['.'],
      alias: {
        '^src/(.+)$': './src/\\1',
        '^locales$': './locales',
      },
    },
  ]
}

module.exports = {
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        path: 'e2e/.env',
      },
    ],
    // Remove @babel/plugin-proposal-numeric-separator when we upgrade metro with the upstream fix (https://github.com/facebook/metro/pull/681)
    '@babel/plugin-proposal-numeric-separator',
    // Remove @babel/plugin-transform-named-capturing-groups-regex once hermes supports named capture groups (https://github.com/facebook/hermes/issues/696)
    '@babel/plugin-transform-named-capturing-groups-regex',
    ...moduleResolverPluginConfig,
    'react-native-reanimated/plugin',
    // NOTE: Reanimated plugin has to be listed last.
  ],
  presets: ['module:metro-react-native-babel-preset'],
  overrides: [
    {
      // required for any dependency (just fiatconnect-sdk as of 2/8/2024)
      // requiring ethers@6
      test: './node_modules/**/ethers',
      plugins: [['@babel/plugin-transform-private-methods', { loose: true }]],
    },
  ],
}
