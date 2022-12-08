import { Address } from '@celo/base'
import { OdisUtils } from '@celo/identity'
import { Environment as PersonaEnvironment } from 'react-native-persona'
import { DEFAULT_FORNO_URL, BIDALI_URL, DEFAULT_TESTNET, RECAPTCHA_SITE_KEY } from 'src/config'
import Logger from 'src/utils/Logger'

export enum Testnets {
  alfajores = 'alfajores',
  mainnet = 'mainnet',
}

interface NetworkConfig {
  networkId: string
  blockchainApiUrl: string
  odisUrl: string // Phone Number Privacy service url
  odisPubKey: string
  komenciUrl: string
  sentryTracingUrls: string[]
  allowedMtwImplementations: string[]
  currentMtwImplementationAddress: string
  recaptchaSiteKey: string
  bidaliUrl: string
  providerFetchUrl: string
  getFiatConnectProvidersUrl: string
  getFiatConnectQuotesUrl: string
  simplexApiUrl: string
  fetchUserLocationDataUrl: string
  komenciLoadCheckEndpoint: string
  walletConnectEndpoint: string
  personaEnvironment: PersonaEnvironment
  inHouseLiquidityURL: string
  setRegistrationPropertiesUrl: string
  fetchExchangesUrl: string
  nftsValoraAppUrl: string
  celoExplorerBaseTxUrl: string
  celoExplorerBaseAddressUrl: string
  approveSwapUrl: string
  executeSwapUrl: string
  verifyPhoneNumberUrl: string
  verifySmsCodeUrl: string
  getPublicDEKUrl: string
  lookupPhoneNumberUrl: string
  lookupAddressUrl: string
  revokePhoneNumberUrl: string
  migratePhoneVerificationUrl: string
  fetchAvailableSuperchargeRewards: string
}

const KOMENCI_URL_MAINNET = 'https://mainnet-komenci.azurefd.net'
const KOMENCI_URL_STAGING = 'https://staging-komenci.azurefd.net'
const CLOUD_FUNCTIONS_STAGING = 'https://api.alfajores.valora.xyz'
const CLOUD_FUNCTIONS_MAINNET = 'https://us-central1-celo-mobile-mainnet.cloudfunctions.net'

const ALLOWED_MTW_IMPLEMENTATIONS_MAINNET: Address[] = [
  '0x6511FB5DBfe95859d8759AdAd5503D656E2555d7',
]
const ALLOWED_MTW_IMPLEMENTATIONS_STAGING: Address[] = [
  '0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A',
  '0x88a2b9B8387A1823D821E406b4e951337fa1D46D',
]

const CURRENT_MTW_IMPLEMENTATION_ADDRESS_MAINNET: Address =
  '0x6511FB5DBfe95859d8759AdAd5503D656E2555d7'
const CURRENT_MTW_IMPLEMENTATION_ADDRESS_STAGING: Address =
  '0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A'

const FETCH_EXCHANGES_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getExchanges`
const FETCH_EXCHANGES_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getExchanges`

const PROVIDER_FETCH_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/fetchProviders`
const PROVIDER_FETCH_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/fetchProviders`

const GET_FIAT_CONNECT_PROVIDERS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getFiatConnectProviders`
const GET_FIAT_CONNECT_PROVIDERS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getFiatConnectProviders`

const GET_FIAT_CONNECT_QUOTES_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getQuotes`
const GET_FIAT_CONNECT_QUOTES_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getQuotes`

const SIMPLEX_API_URL_STAGING = `${CLOUD_FUNCTIONS_STAGING}/processSimplexRequest`
const SIMPLEX_API_URL_PROD = `${CLOUD_FUNCTIONS_MAINNET}/processSimplexRequest`

const FETCH_USER_LOCATION_DATA_STAGING = `${CLOUD_FUNCTIONS_STAGING}/fetchUserLocationData`
const FETCH_USER_LOCATION_DATA_PROD = `${CLOUD_FUNCTIONS_MAINNET}/fetchUserLocationData`

const KOMENCI_LOAD_CHECK_ENDPOINT_STAGING = 'https://staging-komenci.azurefd.net/v1/ready'
const KOMENCI_LOAD_CHECK_ENDPOINT_PROD = 'https://mainnet-komenci.azurefd.net/v1/ready'

const SET_REGISTRATION_PROPERTIES_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/setRegistrationProperties`
const SET_REGISTRATION_PROPERTIES_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/setRegistrationProperties`

const VERIFY_PHONE_NUMBER_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/verifyPhoneNumber`
const VERIFY_PHONE_NUMBER_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/verifyPhoneNumber`

const VERIFY_SMS_CODE_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/verifySmsCode`
const VERIFY_SMS_CODE_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/verifySmsCode`

const GET_PUBLIC_DEK_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getPublicDataEncryptionKey`
const GET_PUBLIC_DEK_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getPublicDataEncryptionKey`

const LOOKUP_PHONE_NUMBER_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/lookupPhoneNumber`
const LOOKUP_PHONE_NUMBER_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/lookupPhoneNumber`

const LOOKUP_ADDRESS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/lookupAddress`
const LOOKUP_ADDRESS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/lookupAddress`

const REVOKE_PHONE_NUMBER_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/revokePhoneNumber`
const REVOKE_PHONE_NUMBER_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/revokePhoneNumber`

const MIGRATE_PHONE_VERIFICATION_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/migrateASv1Verification`
const MIGRATE_PHONE_VERIFICATION_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/migrateASv1Verification`

const FETCH_AVAILABLE_SUPERCHARGE_REWARDS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/fetchAvailableSuperchargeRewards`
const FETCH_AVAILABLE_SUPERCHARGE_REWARDS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/fetchAvailableSuperchargeRewards`

const CELO_EXPLORER_BASE_URL_ALFAJORES = 'https://explorer.celo.org/alfajores'
const CELO_EXPLORER_BASE_URL_MAINNET = 'https://explorer.celo.org/mainnet'

const CELO_EXPLORER_BASE_TX_URL_ALFAJORES = `${CELO_EXPLORER_BASE_URL_ALFAJORES}/tx/`
const CELO_EXPLORER_BASE_TX_URL_MAINNET = `${CELO_EXPLORER_BASE_URL_MAINNET}/tx/`

const CELO_EXPLORER_BASE_ADDRESS_URL_ALFAJORES = `${CELO_EXPLORER_BASE_URL_ALFAJORES}/address/`
const CELO_EXPLORER_BASE_ADDRESS_URL_MAINNET = `${CELO_EXPLORER_BASE_URL_MAINNET}/address/`

const NFTS_VALORA_APP_URL = 'https://nfts.valoraapp.com/'

const APPROVE_SWAP_URL = `${CLOUD_FUNCTIONS_MAINNET}/approveSwap`
const EXECUTE_SWAP_URL = `${CLOUD_FUNCTIONS_MAINNET}/executeSwap`

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Testnets.alfajores]: {
    networkId: '44787',
    // blockchainApiUrl: 'http://127.0.0.1:8080',
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-alfajores.appspot.com',
    odisUrl: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisPubKey,
    komenciUrl: KOMENCI_URL_STAGING,
    sentryTracingUrls: [
      DEFAULT_FORNO_URL,
      'https://blockchain-api-dot-celo-mobile-alfajores.appspot.com',
      CLOUD_FUNCTIONS_STAGING,
      'https://liquidity-dot-celo-mobile-alfajores.appspot.com',
    ],
    allowedMtwImplementations: ALLOWED_MTW_IMPLEMENTATIONS_STAGING,
    currentMtwImplementationAddress: CURRENT_MTW_IMPLEMENTATION_ADDRESS_STAGING,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    bidaliUrl: BIDALI_URL,
    providerFetchUrl: PROVIDER_FETCH_URL_ALFAJORES,
    getFiatConnectProvidersUrl: GET_FIAT_CONNECT_PROVIDERS_ALFAJORES,
    getFiatConnectQuotesUrl: GET_FIAT_CONNECT_QUOTES_ALFAJORES,
    simplexApiUrl: SIMPLEX_API_URL_STAGING,
    fetchUserLocationDataUrl: FETCH_USER_LOCATION_DATA_STAGING,
    komenciLoadCheckEndpoint: KOMENCI_LOAD_CHECK_ENDPOINT_STAGING,
    walletConnectEndpoint: 'wss://relay.walletconnect.org',
    personaEnvironment: PersonaEnvironment.SANDBOX,
    inHouseLiquidityURL: 'https://liquidity-dot-celo-mobile-alfajores.appspot.com',
    setRegistrationPropertiesUrl: SET_REGISTRATION_PROPERTIES_ALFAJORES,
    fetchExchangesUrl: FETCH_EXCHANGES_URL_ALFAJORES,
    nftsValoraAppUrl: NFTS_VALORA_APP_URL,
    celoExplorerBaseTxUrl: CELO_EXPLORER_BASE_TX_URL_ALFAJORES,
    celoExplorerBaseAddressUrl: CELO_EXPLORER_BASE_ADDRESS_URL_ALFAJORES,
    approveSwapUrl: APPROVE_SWAP_URL,
    executeSwapUrl: EXECUTE_SWAP_URL,
    verifyPhoneNumberUrl: VERIFY_PHONE_NUMBER_ALFAJORES,
    verifySmsCodeUrl: VERIFY_SMS_CODE_ALFAJORES,
    getPublicDEKUrl: GET_PUBLIC_DEK_ALFAJORES,
    lookupPhoneNumberUrl: LOOKUP_PHONE_NUMBER_ALFAJORES,
    lookupAddressUrl: LOOKUP_ADDRESS_ALFAJORES,
    revokePhoneNumberUrl: REVOKE_PHONE_NUMBER_ALFAJORES,
    migratePhoneVerificationUrl: MIGRATE_PHONE_VERIFICATION_ALFAJORES,
    fetchAvailableSuperchargeRewards: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_ALFAJORES,
  },
  [Testnets.mainnet]: {
    networkId: '42220',
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-mainnet.appspot.com',
    odisUrl: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisPubKey,
    komenciUrl: KOMENCI_URL_MAINNET,
    sentryTracingUrls: [
      DEFAULT_FORNO_URL,
      'https://blockchain-api-dot-celo-mobile-mainnet.appspot.com',
      CLOUD_FUNCTIONS_MAINNET,
      'https://liquidity-dot-celo-mobile-mainnet.appspot.com',
    ],
    allowedMtwImplementations: ALLOWED_MTW_IMPLEMENTATIONS_MAINNET,
    currentMtwImplementationAddress: CURRENT_MTW_IMPLEMENTATION_ADDRESS_MAINNET,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    bidaliUrl: BIDALI_URL,
    providerFetchUrl: PROVIDER_FETCH_URL_MAINNET,
    getFiatConnectProvidersUrl: GET_FIAT_CONNECT_PROVIDERS_MAINNET,
    getFiatConnectQuotesUrl: GET_FIAT_CONNECT_QUOTES_MAINNET,
    simplexApiUrl: SIMPLEX_API_URL_PROD,
    fetchUserLocationDataUrl: FETCH_USER_LOCATION_DATA_PROD,
    komenciLoadCheckEndpoint: KOMENCI_LOAD_CHECK_ENDPOINT_PROD,
    walletConnectEndpoint: 'wss://relay.walletconnect.org',
    personaEnvironment: PersonaEnvironment.PRODUCTION,
    inHouseLiquidityURL: 'https://liquidity-dot-celo-mobile-mainnet.appspot.com',
    setRegistrationPropertiesUrl: SET_REGISTRATION_PROPERTIES_MAINNET,
    fetchExchangesUrl: FETCH_EXCHANGES_URL_MAINNET,
    nftsValoraAppUrl: NFTS_VALORA_APP_URL,
    celoExplorerBaseTxUrl: CELO_EXPLORER_BASE_TX_URL_MAINNET,
    celoExplorerBaseAddressUrl: CELO_EXPLORER_BASE_ADDRESS_URL_MAINNET,
    approveSwapUrl: APPROVE_SWAP_URL,
    executeSwapUrl: EXECUTE_SWAP_URL,
    verifyPhoneNumberUrl: VERIFY_PHONE_NUMBER_MAINNET,
    verifySmsCodeUrl: VERIFY_SMS_CODE_MAINNET,
    getPublicDEKUrl: GET_PUBLIC_DEK_MAINNET,
    lookupPhoneNumberUrl: LOOKUP_PHONE_NUMBER_MAINNET,
    lookupAddressUrl: LOOKUP_ADDRESS_MAINNET,
    revokePhoneNumberUrl: REVOKE_PHONE_NUMBER_MAINNET,
    migratePhoneVerificationUrl: MIGRATE_PHONE_VERIFICATION_MAINNET,
    fetchAvailableSuperchargeRewards: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_MAINNET,
  },
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
