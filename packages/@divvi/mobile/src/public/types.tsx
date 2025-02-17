import type { ImageSourcePropType } from 'react-native'
import type { NavigatorScreen } from './navigate'

// Type for tab configuration
export interface TabScreenConfig {
  name: string // Just a unique identifier for the screen
  component: React.ComponentType<any>
  icon: (props: { focused: boolean; color: string; size: number }) => React.ReactNode
  label: (t: (key: string) => string) => string
  testID?: string
}

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
export interface PublicAppConfig<tabScreenConfigs extends TabScreenConfig[] = TabScreenConfig[]> {
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
        // backgrounds
        backgroundPrimary?: string
        backgroundSecondary?: string
        backgroundTertiary?: string
        backgroundScrim?: string

        // text, icons, and other content
        contentPrimary?: string
        contentSecondary?: string
        contentTertiary?: string
        textLink?: string

        // borders, shadows, highlights, visual effects
        borderPrimary?: string
        borderSecondary?: string
        softShadow?: string
        lightShadow?: string
        barShadow?: string
        skeletonPlaceholderHighlight?: string
        skeletonPlaceholderBackground?: string
        loadingIndicator?: string

        // interactive elements
        navigationTopPrimary?: string
        navigationTopSecondary?: string
        navigationBottomPrimary?: string
        navigationBottomSecondary?: string
        bottomSheetHandle?: string
        buttonPrimaryBackground?: string
        buttonPrimaryContent?: string
        buttonPrimaryBorder?: string
        buttonSecondaryBackground?: string
        buttonSecondaryContent?: string
        buttonSecondaryBorder?: string
        buttonTertiaryBackground?: string
        buttonTertiaryContent?: string
        buttonTertiaryBorder?: string
        buttonQuickActionBackground?: string
        buttonQuickActionContent?: string
        buttonQuickActionBorder?: string
        textInputBackground?: string
        qrTabBarPrimary?: string
        qrTabBarSecondary?: string

        // statuses and UI feedback colors
        disabled?: string
        inactive?: string
        info?: string
        successPrimary?: string
        successSecondary?: string
        warningPrimary?: string
        warningSecondary?: string
        errorPrimary?: string
        errorSecondary?: string

        // brand colors for decorative elements
        accent?: string
        brandGradientLeft?: string
        brandGradientRight?: string
        contentOnboardingComplete?: string
      }

      assets?: {
        // TODO: refine this as we add more assets (e.g. do we want to group by type? or screens? etc)
        welcomeLogo?: React.ComponentType<any>
        welcomeBackgroundImage?: typeof require
        onboardingSuccessImage?: ImageSourcePropType
        tabHeaderLogo?: React.ComponentType<any>
        noEarnPoolsLogo?: React.ComponentType<any>
        biometryImages?: {
          face?: ImageSourcePropType
          faceId?: ImageSourcePropType
          fingerprint?: ImageSourcePropType
          touchId?: ImageSourcePropType
          iris?: ImageSourcePropType
        }
      }
    }
  }

  // Screen overrides
  screens?: {
    // Tab navigation configuration
    tabs?: (args: {
      defaultTabs: {
        wallet: TabScreenConfig & { name: 'wallet' }
        activity: TabScreenConfig & { name: 'activity' }
        discover: TabScreenConfig & { name: 'discover' }
        earn: TabScreenConfig & { name: 'earn' }
      }
    }) => {
      screens?: tabScreenConfigs
      initialScreen?: tabScreenConfigs[number]['name']
    } // Later we could allow passing in a component for advanced cases
    custom?: (Screen: NavigatorScreen) => React.JSX.Element
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
    statsig?: {
      apiKey: string
    }
    segment?: {
      apiKey: string
    }
  }

  /**
   * Optional copies overwrite. This field should contain the same language keys as @interxyz/mobile.
   * TODO: Eventually, we want to make this fully type-safe (maybe with generics?)
   */
  locales?: Partial<{
    'en-US': Record<string, any>
    'es-419': Record<string, any>
    'pt-BR': Record<string, any>
    de: Record<string, any>
    'ru-RU': Record<string, any>
    'fr-FR': Record<string, any>
    'it-IT': Record<string, any>
    'uk-UA': Record<string, any>
    'th-TH': Record<string, any>
    'tr-TR': Record<string, any>
    'pl-PL': Record<string, any>
    'vi-VN': Record<string, any>
    'zh-CN': Record<string, any>
  }>

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
    // can copy/paste old alchemy key/secret pairs here
    // will be replaced by the networks field
    alchemyKeys?: Record<string, string>
    onboarding?: {
      enableBiometry?: boolean
      protectWallet?: boolean
    }
    activity?: {
      hideActionsCarousel?: boolean
    }
    earn?: {
      showLearnMore?: boolean
      showSafetyScoreOnPoolCard?: boolean
    }
    wallet?: {
      showActionsCarousel?: boolean
      emptyState?: React.ReactElement
    }
    transactions?: {
      emptyState?: React.ReactElement
    }
  }
}

// TODO: we'll use this type throughout the framework once we're able to make bigger refactor, eliminating the current NetworkId enum
export type NetworkId =
  | 'celo-mainnet'
  | 'celo-alfajores'
  | 'ethereum-mainnet'
  | 'ethereum-sepolia'
  | 'arbitrum-one'
  | 'arbitrum-sepolia'
  | 'op-mainnet'
  | 'op-sepolia'
  | 'polygon-pos-mainnet'
  | 'polygon-pos-amoy'
  | 'base-mainnet'
  | 'base-sepolia'
