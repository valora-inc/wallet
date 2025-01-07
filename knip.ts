import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: ['.github/scripts/*.ts', './scripts/**/*.js'],
    },
    'packages/runtime': {
      entry: [
        'index.js!',
        'metro.config.js!',
        // TODO: move these e2e files once we have a e2e setup in the new monorepo
        'e2e/**/*.js',
        'e2e/**/*.ts',
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
        'react-devtools', // application profiling
        'react-native-version',
        'react-native-kill-packager',
        'remote-redux-devtools', // for easy debugging with Flipper
        'typescript-json-schema', // helps manage redux state migrations
        '@segment/sovran-react-native', // required for react-native-segment
        'react-native-adjust', // required for @segment/analytics-react-native-plugin-adjust
        '@types/jest',
        'husky',
        // Following ignores are used by the e2e test
        // TODO: remove these once we have a e2e setup in the new monorepo
        '@faker-js/faker',
        '@mento-protocol/mento-sdk',
        '@types/fs-extra',
        '@walletconnect/sign-client',
        'dotenv',
        'ethers',
        'expect',
        'pixelmatch',
        'ts-retry-promise',
        'twilio',
      ],
      ignore: [
        'src/redux/reducersForSchemaGeneration.ts', // used for root state schema generation
        'src/analytics/docs.ts', // documents analytics events, no references
        'src/account/__mocks__/Persona.tsx', // unit test mocks
        'src/firebase/remoteConfigValuesDefaults.e2e.ts', // e2e test setup
        'src/setupE2eEnv.e2e.ts', // e2e test setup
      ],
    },
  },
}

export default config
