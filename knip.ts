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
    // required by expo
    'expo-build-properties',
    'expo-dev-client',
    'expo-splash-screen',
    'expo-status-bar',
    '@expo/config-plugins',
    // required by divvi
    'babel-plugin-module-resolver',
    // peer deps for @valora/eslint-config-typescript
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-import',
    'eslint-plugin-jest',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-native',
    // prettier
    '@valora/prettier-config',
  ],
  ignore: [],
}

export default config
