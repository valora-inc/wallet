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
export interface PublicAppConfig {
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
