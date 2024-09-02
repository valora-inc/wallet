import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'index.js!',
    'metro.config.js!',
    'e2e/**/*.js',
    'e2e/**/*.ts',
    '.github/scripts/*.ts',
    './scripts/**/*.js',
  ],
  project: ['src/**/*.ts!', 'src/**/*.tsx!', 'src/**/*.js!'],
  ignoreDependencies: [
    'Base64',
    '@actions/github',
    '@babel/runtime', // enforce specific version for react-native
    '@babel/plugin-transform-private-methods', // used in babel.config.js to build. not imported, so knip doesn't understand it is used
    '@react-native-picker/picker', // react-native-picker-select requires
    'babel-jest',
    'jest-circus',
    'jest-html-reporter',
    'jest-junit',
    'jest-snapshot',
    'lint-staged', // pre-commit hook
    'lokijs', // walletconnect e2e tests requires
    'prettier-plugin-java',
    'react-devtools', // application profiling
    'react-native-fast-crypto', // react-native-bip39 requires
    'react-native-version',
    'react-native-kill-packager',
    'remote-redux-devtools', // for easy debugging with Flipper
    'typescript-json-schema', // helps manage redux state migrations
    '@segment/sovran-react-native', // required for react-native-segment
    'react-native-adjust', // required for @segment/analytics-react-native-plugin-adjust
    '@types/isomorphic-fetch',
    '@types/jest',
    'husky',
    'react-native-randombytes', // not sure we need this; only referenced in iOS Podfile.lock
    'bip32', // Temp ignore until we copy the latest version of @celo/cryptographic-utils
    'ethereumjs-util', // Temp ignore until we copy the latest version of @celo/cryptographic-utils
    'randombytes', // Temp ignore until we copy the latest version of @celo/cryptographic-utils
  ],
  ignore: [
    'src/utils/inputValidation.ts',
    'src/utils/country.json',
    'src/utils/account.ts', // Temp ignore until we copy the latest version of @celo/cryptographic-utils
  ],
}

export default config
