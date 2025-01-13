import '@mobilestack-xyz/runtime/src/missingGlobals'
import Config from 'react-native-config'

// Hack, inject directly here for now, since react-native-config doesn't work out of the box with Expo
// TODO: remove once we move to expo env variables
Config.DEFAULT_TESTNET = 'mainnet'
Config.SMS_RETRIEVER_APP_SIGNATURE = 'g9YQFjScXBz'
Config.DEV_SETTINGS_ACTIVE_INITIALLY = 'true'
Config.DEV_RESTORE_NAV_STATE_ON_RELOAD = 'false'
Config.FIREBASE_ENABLED = 'false'
Config.SHOW_TESTNET_BANNER = 'false'
Config.APP_BUNDLE_ID = 'xyz.mobilestack.example'
Config.APP_STORE_ID = '1520414263'
Config.APP_DISPLAY_NAME = 'Example'
// Config.IOS_GOOGLE_SERVICE_PLIST="GoogleService-Info.mainnetdev.plist"
Config.SENTRY_ENABLED = 'false'
Config.AUTH0_DOMAIN = 'auth.valora.xyz'
Config.ONBOARDING_FEATURES_ENABLED = 'EnableBiometry,ProtectWallet,PhoneVerification'
Config.DEEP_LINK_URL_SCHEME = 'celo'
// For now use 'Valora' so CPV works (since it's known by identity-service)
// TODO: find a better long term solution
Config.APP_REGISTRY_NAME = 'Valora'
