// Note: We should be careful of what we import in this module, we don't want to load the entire runtime here
// until createApp is called, since we set some globals here, which will be read by other runtime modules
import '@mobilestack-xyz/runtime/src/missingGlobals'
import Config from 'react-native-config'
import DeviceInfo from 'react-native-device-info'
import { ToggleableOnboardingFeatures } from '../onboarding/types'

// This will evolve. We should be mindful of breaking changes.
// This structure should scale well as we add more features
// and makes it clear what's core configuration vs optional features.
//
// Guidelines:
// - We should only have a few core configuration options, and the rest should be optional features and/or with default values
// - We should only add new configuration options that we want to support long term, and not just for a specific app
// - Configuration options should be well documented and have clear purposes
// - Breaking changes to configuration should be avoided when possible
// - Configuration should be type-safe. In some cases we can consider runtime validation.
interface PublicAppConfig {
  registryName: string
  displayName: string
  deepLinkUrlScheme: string

  // Platform specific configuration
  ios?: {
    appStoreId?: string
  }

  // Theme configuration
  themes?: {
    // Rough example of what we might want to support
    default: {
      // To adjust status bar style, keyboard appearance, etc
      isDark?: boolean
      colors?: {
        // Core brand colors
        primary?: string
        secondary?: string
        background?: string

        // Semantic colors
        error?: string
        success?: string
        warning?: string

        // Text colors
        text?: {
          primary?: string
          secondary?: string
          disabled?: string
        }
      }
    }
  }

  // Optional features/capabilities
  features?: {
    sentry?: {
      clientUrl: string
    }
    // TODO: what's the marketing name for this?
    cloudBackup?: boolean
    walletConnect?: {
      projectId: string
    }
  }

  //
  networks?: {
    // TODO: we'll pass RPC urls, API urls, etc here
  }

  /**
   * Experimental features that may change or be removed in future versions.
   * These features are not part of the stable configuration API and should be used with caution.
   *
   * Features may graduate to the stable API or be removed entirely.
   */
  experimental?: {
    firebase?: boolean
    onboarding?: {
      enableBiometry?: boolean
      protectWallet?: boolean
    }
  }
}

// Note: could be nice to have a direct mapping, but for now it's explicit and simple
// but we have to remember to expose new features
function getOnboardingFeatures(config: PublicAppConfig) {
  const onboardingConfig = config.experimental?.onboarding ?? {
    enableBiometry: true,
    protectWallet: true,
  }

  const onboardingFeatures = []
  if (config.features?.cloudBackup) {
    onboardingFeatures.push(ToggleableOnboardingFeatures.CloudBackup)
    onboardingFeatures.push(ToggleableOnboardingFeatures.CloudBackupSetupInOnboarding)
  }
  // Special case for e2e to test phone number verification
  // As we're not yet sure how we wanna expose this feature in the runtime
  if (process.env.EXPO_PUBLIC_MOBILE_STACK_E2E === 'true') {
    onboardingFeatures.push(ToggleableOnboardingFeatures.PhoneVerification)
  }
  if (onboardingConfig) {
    onboardingFeatures.push(ToggleableOnboardingFeatures.EnableBiometry)
  }
  if (onboardingConfig) {
    onboardingFeatures.push(ToggleableOnboardingFeatures.ProtectWallet)
  }
  return onboardingFeatures.join(',')
}

export function createApp(config: PublicAppConfig) {
  // Hack, map public config to react-native-config
  // TODO: refactor to eliminate this, but for now it avoids more changes in the rest of the codebase
  Config.DEFAULT_TESTNET = 'mainnet'
  Config.DEV_SETTINGS_ACTIVE_INITIALLY = 'false'
  Config.DEV_RESTORE_NAV_STATE_ON_RELOAD = 'false'
  Config.FIREBASE_ENABLED = config.experimental?.firebase ? 'true' : 'false'
  Config.SHOW_TESTNET_BANNER = 'false'
  Config.APP_BUNDLE_ID = DeviceInfo.getBundleId()
  Config.APP_STORE_ID = config.ios?.appStoreId
  Config.APP_DISPLAY_NAME = config.displayName
  Config.SENTRY_ENABLED = config.features?.sentry?.clientUrl ? 'true' : 'false'
  Config.AUTH0_DOMAIN = 'auth.valora.xyz' // TODO: also set auth0ClientId and web3AuthClientId that are needed for cloud backup
  Config.ONBOARDING_FEATURES_ENABLED = getOnboardingFeatures(config)
  Config.DEEP_LINK_URL_SCHEME = config.deepLinkUrlScheme
  Config.APP_REGISTRY_NAME = config.registryName

  // TODO: map/handle the whole config

  const App = require('../app/App').default
  return App
}
