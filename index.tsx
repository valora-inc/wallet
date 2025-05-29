import { createApp } from '@divvi/mobile'
import { registerRootComponent } from 'expo'
import Constants from 'expo-constants'
import Logo from './assets/Logo'
import WelcomeLogo from './assets/WelcomeLogo'
import background from './assets/background.jpg'
import introBackground from './assets/intro-background.png'

const expoConfig = Constants.expoConfig
if (!expoConfig) {
  throw new Error('expoConfig is not available')
}

const App = createApp({
  registryName: expoConfig.extra?.registryName,
  displayName: expoConfig.name,
  deepLinkUrlScheme: expoConfig.scheme![0],
  ios: { appStoreId: expoConfig.extra?.appStoreId },
  networks: expoConfig.extra?.networks,
  // TODO: set divviId and campaignIds
  // divviProtocol: {
  //   divviId:
  //   campaignIds: [],
  // },
  features: {
    cloudBackup: true,
    segment: { apiKey: process.env.EXPO_PUBLIC_SEGMENT_API_KEY! },
    sentry: { clientUrl: process.env.EXPO_PUBLIC_SENTRY_CLIENT_URL! },
    statsig: { apiKey: process.env.EXPO_PUBLIC_STATSIG_API_KEY! },
    walletConnect: {
      projectId: process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
    },
  },
  themes: {
    default: {
      assets: {
        brandLogo: Logo,
        welcomeLogo: WelcomeLogo,
        welcomeBackgroundImage: introBackground,
        onboardingSuccessBackgroundImage: background,
        splashBackgroundImage: background,
      },
    },
  },
  locales: expoConfig.locales ?? {},
  screens: {
    tabs: ({ defaultTabs }) => {
      return {
        screens: [
          defaultTabs.wallet,
          defaultTabs.activity,
          defaultTabs.discover,
        ],
        initialScreen: 'activity',
      }
    },
  },
  experimental: {
    firebase: expoConfig.extra?.firebaseEnabled ?? false,
    alchemyKeys: {
      ALCHEMY_ARBITRUM_API_KEY:
        process.env.EXPO_PUBLIC_ALCHEMY_ARBITRUM_API_KEY!,
      ALCHEMY_BASE_API_KEY: process.env.EXPO_PUBLIC_ALCHEMY_BASE_API_KEY!,
      ALCHEMY_ETHEREUM_API_KEY:
        process.env.EXPO_PUBLIC_ALCHEMY_ETHEREUM_API_KEY!,
      ALCHEMY_OPTIMISM_API_KEY:
        process.env.EXPO_PUBLIC_ALCHEMY_OPTIMISM_API_KEY!,
      ALCHEMY_POLYGON_POS_API_KEY:
        process.env.EXPO_PUBLIC_ALCHEMY_POLYGON_POS_API_KEY!,
    },
    bidali: {
      url: process.env.EXPO_PUBLIC_BIDALI_URL!,
    },
    inviteFriends: true,
    notificationCenter: true,
    phoneNumberVerification: true,
    zendeskConfig: {
      apiKey: process.env.EXPO_PUBLIC_ZENDESK_API_KEY!,
      projectName: 'valoraapp',
    },
    otaTranslations: {
      crowdinDistributionHash: 'e-f9f6869461793b9d1a353b2v7c',
    },
  },
})

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
