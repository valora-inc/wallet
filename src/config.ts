import { Network } from '@fiatconnect/fiatconnect-types'
import Config from 'react-native-config'
import { CachesDirectoryPath } from 'react-native-fs'
import { SpendMerchant } from 'src/fiatExchanges/Spend'
import { LoggerLevel } from 'src/utils/LoggerLevels'
// eslint-disable-next-line import/no-relative-packages
import { TORUS_SAPPHIRE_NETWORK } from '@toruslabs/constants'
import { LaunchArguments } from 'react-native-launch-arguments'
import { HomeActionName } from 'src/home/types'
import { ToggleableOnboardingFeatures } from 'src/onboarding/types'
import { stringToBoolean } from 'src/utils/parsing'
import * as secretsFile from '../secrets.json'
import { ONE_HOUR_IN_MILLIS } from './utils/time'

export interface ExpectedLaunchArgs {
  statsigGateOverrides?: string // format: gate_1=true,gate_2=false
  onboardingOverrides?: string // same format as ONBOARDING_FEATURES_ENABLED env var
}

// extract secrets from secrets.json
const keyOrUndefined = (file: any, secretsKey: any, attribute: any) => {
  if (secretsKey in file) {
    if (attribute in file[secretsKey]) {
      return file[secretsKey][attribute]
    }
  }
  return undefined
}

const configOrThrow = (key: string) => {
  const value = Config[key]
  if (value) {
    return value
  }
  throw new RangeError(`Missing Config value for ${key}`)
}

export const APP_NAME = 'Valora'

// DEV only related settings
export const isE2EEnv = stringToBoolean(Config.IS_E2E || 'false')
export const DEV_RESTORE_NAV_STATE_ON_RELOAD = stringToBoolean(
  Config.DEV_RESTORE_NAV_STATE_ON_RELOAD || 'false'
)
export const DEV_SETTINGS_ACTIVE_INITIALLY = stringToBoolean(
  Config.DEV_SETTINGS_ACTIVE_INITIALLY || 'false'
)

// VALUES
export const ALERT_BANNER_DURATION = 5000
// The maximum allowed value to add funds
export const DOLLAR_ADD_FUNDS_MAX_AMOUNT = 5000
// The minimum allowed value for a transaction such as a transfer
export const STABLE_TRANSACTION_MIN_AMOUNT = 0.01
export const TOKEN_MIN_AMOUNT = 0.00000001
// The minimum amount for a wallet to be considered as "funded"
export const DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED = 0.01
// The number of seconds before the sender can reclaim the payment.
export const DEFAULT_TESTNET = configOrThrow('DEFAULT_TESTNET')
// Additional gas added when setting the fee currency
// See details where used.
export const STATIC_GAS_PADDING = 50_000

export const TIME_UNTIL_TOKEN_INFO_BECOMES_STALE = 12 * ONE_HOUR_IN_MILLIS

export const DEFAULT_FORNO_URL =
  DEFAULT_TESTNET === 'mainnet'
    ? 'https://forno.celo.org/'
    : 'https://alfajores-forno.celo-testnet.org/'

export const APP_BUNDLE_ID = configOrThrow('APP_BUNDLE_ID')

// The network that FiatConnect providers operate on
export const FIATCONNECT_NETWORK =
  DEFAULT_TESTNET === 'mainnet' ? Network.Mainnet : Network.Alfajores

export const STATSIG_ENV = {
  tier: DEFAULT_TESTNET === 'mainnet' ? 'production' : 'development',
}
export const E2E_TEST_STATSIG_ID = 'e2e_test_statsig_id'

// Keyless backup settings
export const TORUS_NETWORK =
  DEFAULT_TESTNET === 'mainnet'
    ? TORUS_SAPPHIRE_NETWORK.SAPPHIRE_MAINNET
    : TORUS_SAPPHIRE_NETWORK.SAPPHIRE_DEVNET

// FEATURE FLAGS
export const FIREBASE_ENABLED = stringToBoolean(Config.FIREBASE_ENABLED || 'true')
export const SHOW_TESTNET_BANNER = stringToBoolean(Config.SHOW_TESTNET_BANNER || 'false')
export const SENTRY_ENABLED = stringToBoolean(Config.SENTRY_ENABLED || 'false')

// SECRETS
export const WEB3AUTH_CLIENT_ID = keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'WEB3AUTH_CLIENT_ID')

export const ALCHEMY_ETHEREUM_API_KEY = keyOrUndefined(
  secretsFile,
  DEFAULT_TESTNET,
  'ALCHEMY_ETHEREUM_API_KEY'
)
export const ALCHEMY_ARBITRUM_API_KEY = keyOrUndefined(
  secretsFile,
  DEFAULT_TESTNET,
  'ALCHEMY_ARBITRUM_API_KEY'
)
export const ALCHEMY_OPTIMISM_API_KEY = keyOrUndefined(
  secretsFile,
  DEFAULT_TESTNET,
  'ALCHEMY_OPTIMISM_API_KEY'
)
export const ALCHEMY_POLYGON_POS_API_KEY = keyOrUndefined(
  secretsFile,
  DEFAULT_TESTNET,
  'ALCHEMY_POLYGON_POS_API_KEY'
)
export const ALCHEMY_BASE_API_KEY = keyOrUndefined(
  secretsFile,
  DEFAULT_TESTNET,
  'ALCHEMY_BASE_API_KEY'
)

export const ZENDESK_API_KEY = keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'ZENDESK_API_KEY')
export const STATSIG_API_KEY =
  keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'STATSIG_API_KEY') ??
  // dummy key as fallback for e2e tests, which use local mode
  'client-key'
export const SEGMENT_API_KEY = keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'SEGMENT_API_KEY')
export const SENTRY_CLIENT_URL = keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'SENTRY_CLIENT_URL')
export const RECAPTCHA_SITE_KEY = keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'RECAPTCHA_SITE_KEY')
export const BIDALI_URL = keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'BIDALI_URL')
export const WALLET_CONNECT_PROJECT_ID =
  keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'WALLET_CONNECT_PROJECT_ID') ??
  // mobilestack-e2e-client project in the WC project dashboard
  '36d4ec3335559558180cc1079152fcb3'
export const AUTH0_CLIENT_ID =
  keyOrUndefined(secretsFile, DEFAULT_TESTNET, 'AUTH0_CLIENT_ID') ??
  // dev app client id as fallback for e2e tests
  'YgsHPq93Egfap5Wc4iEQlGyQMqjLeBf2'

export const AUTH0_DOMAIN = configOrThrow('AUTH0_DOMAIN')

export const SPEND_MERCHANT_LINKS: SpendMerchant[] = [
  {
    name: 'Beam and Go',
    link: 'https://valora.beamandgo.com/',
  },
  {
    name: 'Merchant Map',
    link: 'https://celo.org/experience/merchant/merchants-accepting-celo#map',
    subtitleKey: 'findMerchants',
  },
]

export const DEFAULT_PERSONA_TEMPLATE_ID = 'itmpl_5FYHGGFhdAYvfd7FvSpNADcC'

export const CELO_LOGO_URL =
  'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fcelo.jpeg?alt=media'
export const SUPERCHARGE_LOGO_URL =
  'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsupercharge_logo.png?alt=media'

export const SIMPLEX_FEES_URL =
  'https://support.simplex.com/hc/en-gb/articles/360014078420-What-fees-am-I-paying-'

// N.B.: Make sure to update the following files to match this value:
// * app.json
// * android/**/AndroidManifest.xml
// * ios/**/AppDelegate.mm
export const DEEPLINK_PREFIX = 'celo'

export const APP_STORE_ID = Config.APP_STORE_ID
export const DYNAMIC_LINK_DOMAIN_URI_PREFIX = 'https://vlra.app'
export const CROWDIN_DISTRIBUTION_HASH = 'e-f9f6869461793b9d1a353b2v7c'
export const OTA_TRANSLATIONS_FILEPATH = `file://${CachesDirectoryPath}/translations`

export const FETCH_TIMEOUT_DURATION = 15000 // 15 seconds

export const DEFAULT_APP_LANGUAGE = 'en-US'

export const ZENDESK_PROJECT_NAME = 'valoraapp'

// Logging and monitoring
export const DEFAULT_SENTRY_TRACES_SAMPLE_RATE = 0.2
export const DEFAULT_SENTRY_NETWORK_ERRORS = [
  'network request failed',
  'The network connection was lost',
]

const configLoggerLevels: { [key: string]: LoggerLevel } = {
  debug: LoggerLevel.Debug,
  info: LoggerLevel.Info,
  warn: LoggerLevel.Warn,
  error: LoggerLevel.Error,
}

export const LOGGER_LEVEL = Config.LOGGER_LEVEL
  ? (configLoggerLevels[Config.LOGGER_LEVEL] ?? LoggerLevel.Debug)
  : LoggerLevel.Debug

export const PHONE_NUMBER_VERIFICATION_CODE_LENGTH = 6

const ONBOARDING_FEATURES_ALL_DISABLED = Object.fromEntries(
  Object.values(ToggleableOnboardingFeatures).map((value) => [value, false])
)

export const ONBOARDING_FEATURES_ENABLED = (
  LaunchArguments.value<ExpectedLaunchArgs>()?.onboardingOverrides ??
  Config.ONBOARDING_FEATURES_ENABLED ??
  Object.values(ToggleableOnboardingFeatures).join(',')
)
  .split(',')
  .filter(
    (value) =>
      !!value &&
      Object.values(ToggleableOnboardingFeatures).includes(value as ToggleableOnboardingFeatures)
  )
  .reduce((acc, value) => {
    acc[value] = true
    return acc
  }, ONBOARDING_FEATURES_ALL_DISABLED)

export const ENABLED_QUICK_ACTIONS = (
  Config.ENABLED_QUICK_ACTIONS ??
  // Default to all actions
  Object.values(HomeActionName).join(',')
)
  .split(',')
  .filter(
    (value) => !!value && Object.values(HomeActionName).includes(value as HomeActionName)
  ) as HomeActionName[]

export const FETCH_FIATCONNECT_QUOTES = true
