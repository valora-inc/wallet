import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'index.tsx!',
    'app.config.js!',
    'metro.config.js!',
    '.github/scripts/*.ts',
    './scripts/**/*.{js,ts}',
  ],
  ignoreDependencies: [
    '@actions/github',
    'babel-preset-expo', // not listed in package.json so we use the version used by expo
    // required by expo
    'expo-build-properties',
    'expo-dev-client',
    'expo-font',
    'expo-splash-screen',
    'expo-status-bar',
    // peer deps for @valora/eslint-config-typescript
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-import',
    'eslint-plugin-jest',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-native',
    // patches https://www.npmjs.com/package/patch-package#why-use-postinstall-postinstall-with-yarn
    'postinstall-postinstall',
  ],
  ignoreBinaries: [
    'eas', // Expo Application Services
    'licenses', // Yarn command
    'scripts/generate-release-notes.ts', // Used by release-nightly workflow
  ],
  ignore: [
    '.github/scripts/autoApprovePr.js', // Used by bump-app-version workflow
    '.github/scripts/enableAutomergeOnPr.js', // Used by bump-app-version workflow
  ],
}

export default config
