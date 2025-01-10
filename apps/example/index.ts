import { registerRootComponent } from 'expo'
import './missingGlobals'
import App from '@mobilestack-xyz/runtime/src/app/App'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
