const { version } = require('./package.json')

const mainnetSettings = {
  showTestnetBanner: false,
  networks: {
    'celo-mainnet': true,
    'ethereum-mainnet': true,
    'arbitrum-one': true,
    'op-mainnet': true,
    'base-mainnet': true,
  },
}

const testnetSettings = {
  showTestnetBanner: true,
  networks: {
    'celo-alfajores': true,
    'ethereum-sepolia': true,
    'arbitrum-one': true,
    'op-sepolia': true,
    'base-sepolia': true,
  },
}

module.exports = () => {
  const appVariant = process.env.APP_VARIANT ?? 'mainnet'

  const getAppConfig = () => {
    switch (appVariant) {
      case 'mainnet':
        return {
          ...mainnetSettings,
          name: 'Valora',
          appStoreId: '1520414263',
          bundleId: 'co.clabs.valora',
          authDomain: 'auth.valora.xyz',
        }
      case 'mainnet-nightly':
        return {
          ...mainnetSettings,
          name: 'Valora (nightly)',
          appStoreId: '1599290566',
          bundleId: 'co.clabs.valora.nightly',
          authDomain: 'auth.valora.xyz',
        }
      case 'alfajores':
        return {
          ...testnetSettings,
          name: 'Alfajores',
          appStoreId: '1482389446',
          bundleId: 'org.celo.mobile.alfajores',
          authDomain: 'auth.alfajores.valora.xyz',
        }
      case 'alfajores-nightly':
        return {
          ...testnetSettings,
          name: 'Alfajores (nightly)',
          appStoreId: '1599287614',
          bundleId: 'org.celo.mobile.alfajores.nightly',
          authDomain: 'auth.alfajores.valora.xyz',
        }
      default:
        throw new Error(`Unknown app variant: ${appVariant}`)
    }
  }

  const { name, appStoreId, bundleId, authDomain, networks, showTestnetBanner } = getAppConfig()

  return {
    expo: {
      name,
      slug: 'valora',
      scheme: 'celo',
      version,
      orientation: 'portrait',
      icon: './assets/icon/icon.png',
      userInterfaceStyle: 'light',
      // disable for now as it causes an Android build error with react-native-auth0
      // See https://github.com/auth0/react-native-auth0/issues/879
      newArchEnabled: false,
      ios: {
        icon: './assets/icon/icon.png',
        supportsTablet: false,
        bundleIdentifier: bundleId,
        associatedDomains: ['applinks:vlra.app', 'applinks:valoraapp.com'],
        infoPlist: {
          NSCameraUsageDescription: 'Connecting your camera allows you to scan codes for payments.',
          NSContactsUsageDescription:
            'Adding your contacts makes it easy to send and request payments with your friends.',
          NSPhotoLibraryAddUsageDescription:
            'Connecting your photo library allows you to save your code to your photos.',
          NSPhotoLibraryUsageDescription: 'This is required for you to choose a profile picture.',
          NSUserTrackingUsageDescription:
            'We use the advertising identifier to accurately attribute app installs from ad campaigns.',
          NSFaceIDUsageDescription:
            'This is required for you to use Face ID to secure your account.',
          ITSAppUsesNonExemptEncryption: false,
        },
        entitlements: {
          'aps-environment': 'production',
        },
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/icon/adaptive-foreground.png',
          backgroundImage: './assets/icon/adaptive-background.png',
        },
        package: bundleId,
        permissions: [
          'android.permission.CAMERA',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.INTERNET',
          'android.permission.POST_NOTIFICATIONS',
        ],
      },
      plugins: [
        [
          'expo-splash-screen',
          {
            android: {
              image: './assets/splash-icon.png',
              imageWidth: 200,
              resizeMode: 'contain',
            },
            ios: {
              image: './assets/splash-gradient.png',
              enableFullScreenImage_legacy: true,
              resizeMode: 'cover',
            },
          },
        ],
        [
          'expo-font',
          {
            fonts: [
              'fonts/Inter-Bold.ttf',
              'fonts/Inter-Medium.ttf',
              'fonts/Inter-Regular.ttf',
              'fonts/Inter-SemiBold.ttf',
            ],
          },
        ],
        [
          'expo-build-properties',
          {
            ios: {
              // Minimum iOS version we support
              deploymentTarget: '15.1',
              useFrameworks: 'static',
            },
            android: {
              // For Persona SDK
              extraMavenRepos: ['https://sdk.withpersona.com/android/releases'],
              // Ad hoc fix for Android build error
              kotlinVersion: '1.9.24',
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
            domain: authDomain,
          },
        ],
        '@divvi/mobile',
        './plugins/withConditionalDetox',
        [
          './plugins/withCustomGradleProperties',
          {
            'org.gradle.jvmargs': '-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError',
          },
        ],
      ],
      extra: {
        appStoreId,
        networks,
        showTestnetBanner,
        eas: {
          projectId: '8593729d-4d16-40aa-b712-7f96b2293c9f',
        },
      },
      owner: 'divvi',
    },
  }
}
