import { createApp } from '@mobilestack-xyz/runtime/src/public/createApp'
import { registerRootComponent } from 'expo'
import Constants from 'expo-constants'

const expoConfig = Constants.expoConfig
if (!expoConfig) {
  throw new Error('expoConfig is not available')
}

// Create Mobile Stack app
const App = createApp({
  // For now use 'Valora' so CPV works (since it's known by identity-service)
  // TODO: find a better long term solution
  registryName: 'Valora',
  displayName: expoConfig.name,
  deepLinkUrlScheme: expoConfig.scheme
    ? Array.isArray(expoConfig.scheme)
      ? expoConfig.scheme[0]
      : expoConfig.scheme
    : 'example',
  features: {
    // Special case for e2e tests as it doesn't handle cloud backup
    ...(process.env.EXPO_PUBLIC_MOBILE_STACK_E2E === 'true' && {
      cloudBackup: false,
    }),
  },
})

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
