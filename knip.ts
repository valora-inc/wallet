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
    'react-native-version',
    'react-native-kill-packager',
    'remote-redux-devtools', // for easy debugging with Flipper
    'typescript-json-schema', // helps manage redux state migrations
    '@segment/sovran-react-native', // required for react-native-segment
    'react-native-adjust', // required for @segment/analytics-react-native-plugin-adjust
    '@types/jest',
    'husky',
  ],
  ignore: ['src/utils/inputValidation.ts', 'src/utils/country.json'],
}

export default config
