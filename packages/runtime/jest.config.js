const reactNativeJestPreset = require('react-native/jest-preset')
const { defaults: tsjPreset } = require('ts-jest/presets')

module.exports = {
  ...tsjPreset,
  globals: {
    navigator: true,
    window: true,
  },
  haste: {
    ...reactNativeJestPreset.haste,
    defaultPlatform: 'android',
  },
  moduleNameMapper: {
    'react-native-svg': '<rootDir>/node_modules/react-native-svg-mock',
    // For some reason jest doesn't pick it up automatically from the __mocks__ folder
    // like the other modules, adding it here fixes it
    'secrets.json': '<rootDir>/__mocks__/secrets.json',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
    '^locales$': '<rootDir>/locales',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/jest_setup.ts',
    '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
        // Disables type-check when running tests as it takes valuable time
        // and is redundant with the tsc build step
        isolatedModules: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
    '^.+\\.(txt)$': require.resolve('./node_modules/react-native/jest/assetFileTransformer.js'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!@?react-native|@react-navigation|@react-native-community|uuid|statsig-js|@react-native-firebase|react-navigation|redux-persist|date-fns|victory-*|@walletconnect/react-native-compat|react-redux|@segment/analytics-react-native/node_modules/uuid)',
  ],
}
