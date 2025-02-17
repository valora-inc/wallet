import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: ['.github/scripts/*.ts', './scripts/**/*.js'],
      ignoreBinaries: [
        // Maybe we can remove these once we upgrade knip?
        // See https://github.com/webpro-nl/knip/issues/735
        'e2e:prebuild', // used in workflows to build the example app
        'e2e:build:android-release', // used in workflows to build the example app
        'typecheck', // used in workflows to typecheck the example app
        'build:plugin', // used in postinstall script
      ],
      ignoreDependencies: [
        '@semantic-release/commit-analyzer', // imported by multi-semantic-release
        '@semantic-release/github', // imported by multi-semantic-release
        '@semantic-release/npm', // imported by multi-semantic-release
        '@semantic-release/release-notes-generator', // imported by multi-semantic-release
        'conventional-changelog-conventionalcommits', // used by semantic-release config preset
      ],
    },
    'apps/example': {
      entry: [
        'index.tsx!',
        'metro.config.js!',
        'detox.config.js!',
        'plugins/**/*.{js,ts}',
        'e2e/**/*.{js,ts}',
      ],
      ignoreDependencies: [
        '@babel/core', // needed for react-native
        // TODO: these ignores should be unnecessary once we use a recent version of knip with th expo plugin
        // See https://github.com/webpro-nl/knip/pull/879
        'expo-build-properties', // used in app.json
        'expo-dev-client', // used in app.json
        'expo-splash-screen', // used in app.json
        'expo-status-bar', // used in app.json
        '@config-plugins/detox', // used in app.json
        'babel-preset-expo', // not listed in package.json so we use the version used by expo
        'babel-plugin-module-resolver', // not listed in package.json so we use the version from the runtime for now
        'ts-node', // used in workflows run by github actions from the example app dir
        '@walletconnect/core', // used in e2e tests via @walletconnect/sign-client
        'tslib', // for some reason this is triggered after applying multiple tsconfigs to "extends" of apps/example/tsconfig.json
        '@tsconfig/node-lts', // used in e2e/tsconfig.json
      ],
    },
    'packages/@divvi/mobile': {
      entry: ['index.js!', 'metro.config.js!', './scripts/**/*.js'],
      project: ['src/**/*.ts!', 'src/**/*.tsx!', 'src/**/*.js!'],
      ignoreDependencies: [
        '@actions/github',
        'babel-plugin-module-resolver', // used in babel.config.js to build. not imported, so knip doesn't understand it is used
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
        '@types/jest',
        'husky',
        '@tsconfig/node-lts', // used in plugin/tsconfig.json
        'react-native-flipper',
        'redux-flipper',
      ],
      ignore: [
        'src/redux/reducersForSchemaGeneration.ts', // used for root state schema generation
        'src/analytics/docs.ts', // documents analytics events, no references
        'src/account/__mocks__/Persona.tsx', // unit test mocks
        'src/setupE2eEnv.e2e.ts', // e2e test setup
        'src/components/ReviewTransaction.tsx', // will be removed once used in SendConfirmation
      ],
    },
  },
}

export default config
