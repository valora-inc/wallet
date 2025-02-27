import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'index.tsx!',
    'metro.config.js!',
    'e2e/**/*.js',
    'e2e/**/*.ts',
    '.github/scripts/*.ts',
    './scripts/**/*.js',
  ],
  project: ['src/**/*.ts!', 'src/**/*.tsx!', 'src/**/*.js!'],
  ignoreDependencies: [
    '@actions/github',
    '@react-native-picker/picker', // react-native-picker-select requires
    'lint-staged', // pre-commit hook
    '@segment/sovran-react-native', // required for react-native-segment
    'react-native-adjust', // required for @segment/analytics-react-native-plugin-adjust
    'husky',
  ],
  ignore: [],
}

export default config
