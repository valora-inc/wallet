import { createApp } from '@divvi/mobile'
import { registerRootComponent } from 'expo'
import Constants from 'expo-constants'
import Logo from './assets/Logo'
import WelcomeLogo from './assets/WelcomeLogo'

const expoConfig = Constants.expoConfig
if (!expoConfig) {
  throw new Error('expoConfig is not available')
}

const App = createApp({
  registryName: expoConfig.name,
  displayName: expoConfig.name,
  deepLinkUrlScheme: expoConfig.scheme as string,
  ios: { appStoreId: expoConfig.extra?.appStoreId },
  networks: expoConfig.extra?.networks,
  features: {
    cloudBackup: true,
    segment: { apiKey: process.env.EXPO_PUBLIC_SEGMENT_API_KEY! },
    sentry: { clientUrl: process.env.EXPO_PUBLIC_SENTRY_CLIENT_URL! },
    statsig: { apiKey: process.env.EXPO_PUBLIC_STATSIG_API_KEY! },
    walletConnect: { projectId: process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID! },
  },
  themes: {
    default: {
      assets: {
        brandLogo: Logo,
        welcomeLogo: WelcomeLogo,
        welcomeBackgroundImage: require('./assets/intro-background.png'),
      },
    },
  },
  locales: {
    'en-US': require('./locales/en-US.json'),
    'es-419': require('./locales/es-419.json'),
    'pt-BR': require('./locales/pt-BR.json'),
    de: require('./locales/de.json'),
    'ru-RU': require('./locales/ru-RU.json'),
    'fr-FR': require('./locales/fr-FR.json'),
    'it-IT': require('./locales/it-IT.json'),
    'uk-UA': require('./locales/uk-UA.json'),
    'pl-PL': require('./locales/pl-PL.json'),
    'th-TH': require('./locales/th-TH.json'),
    'tr-TR': require('./locales/tr-TR.json'),
    'vi-VN': require('./locales/vi-VN.json'),
    'zh-CN': require('./locales/zh-CN.json'),
  },
  screens: {
    tabs: ({ defaultTabs }) => {
      return {
        screens: [defaultTabs.wallet, defaultTabs.activity, defaultTabs.discover],
        initialScreen: 'activity',
      }
    },
  },
  experimental: {
    firebase: expoConfig.extra?.firebaseEnabled ?? false,
    alchemyKeys: {
      ALCHEMY_ARBITRUM_API_KEY: process.env.EXPO_PUBLIC_ALCHEMY_ARBITRUM_API_KEY!,
      ALCHEMY_BASE_API_KEY: process.env.EXPO_PUBLIC_ALCHEMY_BASE_API_KEY!,
      ALCHEMY_ETHEREUM_API_KEY: process.env.EXPO_PUBLIC_ALCHEMY_ETHEREUM_API_KEY!,
      ALCHEMY_OPTIMISM_API_KEY: process.env.EXPO_PUBLIC_ALCHEMY_OPTIMISM_API_KEY!,
      ALCHEMY_POLYGON_POS_API_KEY: process.env.EXPO_PUBLIC_ALCHEMY_POLYGON_POS_API_KEY!,
    },
    bidali: {
      url: process.env.EXPO_PUBLIC_BIDALI_URL!,
    },
    zendeskConfig: {
      apiKey: process.env.EXPO_PUBLIC_ZENDESK_API_KEY!,
      projectName: 'valoraapp',
    },
  },
})

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
