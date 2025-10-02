const fs = require('fs')
const { version } = require('./package.json')
const withAndroidAppThemeFullScreen = require('./plugins/withAndroidAppThemeFullScreen')
const withCustomGradleProperties = require('./plugins/withCustomGradleProperties')
const withDesugaring = require('./plugins/withDesugaring')

const APP_REGISTRY_NAME = 'Valora'

// Firebase credentials
const GOOGLE_SERVICE_INFO_PLIST =
  process.env.GOOGLE_SERVICE_INFO_PLIST ??
  `${process.env.PWD}/.eas/.env/GOOGLE_SERVICES_PLIST`
const GOOGLE_SERVICES_JSON =
  process.env.GOOGLE_SERVICES_JSON ??
  `${process.env.PWD}/.eas/.env/GOOGLE_SERVICES_JSON`
const firebaseEnabled =
  fs.existsSync(GOOGLE_SERVICE_INFO_PLIST) &&
  fs.existsSync(GOOGLE_SERVICES_JSON)

module.exports = () => {
  const appVariant = process.env.APP_VARIANT ?? 'mainnet-dev'

  const getAppConfig = () => {
    switch (appVariant) {
      case 'mainnet':
        return {
          name: 'Valora',
          appStoreId: '1520414263',
          bundleId: 'co.clabs.valora',
          auth0Domain: 'auth.valora.xyz',
        }
      case 'mainnet-dev':
        return {
          name: 'Valora (dev)',
          appStoreId: '1520414263',
          bundleId: 'co.clabs.valora.dev',
          auth0Domain: 'auth.valora.xyz',
        }
      case 'mainnet-nightly':
        return {
          name: 'Valora (nightly)',
          appStoreId: '1599290566',
          bundleId: 'co.clabs.valora.nightly',
          auth0Domain: 'auth.valora.xyz',
        }
      default:
        throw new Error(`Unknown app variant: ${appVariant}`)
    }
  }

  const { name, appStoreId, bundleId, auth0Domain } = getAppConfig()

  return {
    expo: {
      name,
      slug: 'valora',
      // Main scheme should be first (see index.tsx)
      scheme: ['celo', 'wc'],
      version,
      orientation: 'portrait',
      icon: './assets/icon/icon.png',
      userInterfaceStyle: 'light',
      // disable for now as it causes an Android build error with react-native-auth0
      // See https://github.com/auth0/react-native-auth0/issues/879
      newArchEnabled: false,
      ios: {
        icon: './assets/icon/icon.png',
        splash: {
          image: './assets/splash/xxxhdpi.jpg',
          resizeMode: 'cover',
          backgroundColor: '#ffffff',
        },
        supportsTablet: false,
        bundleIdentifier: bundleId,
        associatedDomains: ['applinks:vlra.app', 'applinks:valoraapp.com'],
        infoPlist: {
          NSCameraUsageDescription:
            'Connecting your camera allows you to scan codes for payments.',
          NSContactsUsageDescription:
            'Adding your contacts makes it easy to send and request payments with your friends.',
          NSPhotoLibraryAddUsageDescription:
            'Connecting your photo library allows you to save your code to your photos.',
          NSPhotoLibraryUsageDescription:
            'This is required for you to choose a profile picture.',
          NSUserTrackingUsageDescription:
            'We use the advertising identifier to accurately attribute app installs from ad campaigns.',
          NSFaceIDUsageDescription:
            'This is required for you to use Face ID to secure your account.',
          NSLocationWhenInUseUsageDescription:
            'This app requires location access to provide location-based features.',
          CFBundleAllowMixedLocalizations: true,
          ITSAppUsesNonExemptEncryption: false,
        },
        entitlements: {
          'aps-environment': 'production',
        },
        ...(firebaseEnabled && {
          googleServicesFile: GOOGLE_SERVICE_INFO_PLIST,
        }),
      },
      android: {
        edgeToEdgeEnabled: false,
        adaptiveIcon: {
          foregroundImage: './assets/icon/adaptive-foreground.png',
          backgroundImage: './assets/icon/adaptive-background.png',
        },
        splash: {
          backgroundColor: '#ffffff',
          resizeMode: 'cover',
          mdpi: './assets/splash/mdpi.jpg',
          hdpi: './assets/splash/hdpi.jpg',
          xhdpi: './assets/splash/xhdpi.jpg',
          xxhdpi: './assets/splash/xxhdpi.jpg',
          xxxhdpi: './assets/splash/xxxhdpi.jpg',
        },
        package: bundleId,
        // IMPORTANT: to avoid react-native-keychain issues when reinstalling the app
        allowBackup: false,
        // App Links
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [
              { scheme: 'https', host: 'valoraapp.com' },
              { scheme: 'https', host: 'vlra.app' },
              { pathPrefix: '/wc' },
              { scheme: 'http' },
            ],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ],
        permissions: [
          'android.permission.CAMERA',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.INTERNET',
          'android.permission.POST_NOTIFICATIONS',
        ],
        ...(firebaseEnabled && {
          googleServicesFile: GOOGLE_SERVICES_JSON,
        }),
      },
      plugins: [
        withAndroidAppThemeFullScreen,
        [
          'expo-font',
          {
            fonts: [
              'assets/fonts/Inter-Bold.ttf',
              'assets/fonts/Inter-Medium.ttf',
              'assets/fonts/Inter-Regular.ttf',
              'assets/fonts/Inter-SemiBold.ttf',
            ],
          },
        ],
        [
          'expo-build-properties',
          {
            android: {
              targetSdkVersion: 35, // Use 35 as edgeToEdge support is required for SDK 35+
            },
            ios: {
              // Minimum iOS version we support
              deploymentTarget: '15.1',
              useFrameworks: 'static',
            },
          },
        ],
        [
          'react-native-permissions',
          {
            iosPermissions: ['Camera', 'AppTrackingTransparency', 'Contacts'],
          },
        ],
        [
          'react-native-auth0',
          {
            domain: auth0Domain,
          },
        ],
        [
          '@divvi/mobile',
          {
            // Used in the User-Agent header
            appName: APP_REGISTRY_NAME,
          },
        ],
        [
          withCustomGradleProperties,
          {
            'org.gradle.jvmargs': '-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError',
          },
        ],
        [
          'expo-camera',
          {
            recordAudioAndroid: false,
          },
        ],
        ...(firebaseEnabled
          ? [
              '@react-native-firebase/app',
              '@react-native-firebase/auth',
              '@react-native-firebase/messaging',
            ]
          : []),
        ...(process.env.SENTRY_AUTH_TOKEN
          ? [
              [
                '@sentry/react-native/expo',
                {
                  organization: 'valora-inc',
                  project: 'celo-mobile',
                  url: 'https://sentry.io/',
                },
              ],
            ]
          : []),
        withDesugaring,
      ],
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
      extra: {
        registryName: APP_REGISTRY_NAME,
        appStoreId,
        auth0Domain,
        firebaseEnabled,
        eas: {
          projectId: '8593729d-4d16-40aa-b712-7f96b2293c9f',
        },
      },
      owner: 'divvi',
    },
  }
}
