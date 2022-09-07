import { Address } from '@celo/base'
import { OdisUtils } from '@celo/identity'
import { Environment as PersonaEnvironment } from 'react-native-persona'
import {
  BIDALI_URL,
  DEFAULT_SYNC_MODE,
  DEFAULT_TESTNET,
  FIREBASE_DB_URL,
  FORNO_ENABLED_INITIALLY,
  GETH_USE_FULL_NODE_DISCOVERY,
  GETH_USE_STATIC_NODES,
  RECAPTCHA_SITE_KEY,
} from 'src/config'
import { GethSyncMode } from 'src/geth/consts'
import Logger from 'src/utils/Logger'

export enum Testnets {
  alfajores = 'alfajores',
  mainnet = 'mainnet',
}

interface NetworkConfig {
  networkId: string
  nodeDir: string
  syncMode: GethSyncMode
  initiallyForno: boolean
  blockchainApiUrl: string
  odisUrl: string // Phone Number Privacy service url
  odisPubKey: string
  useDiscovery: boolean
  useStaticNodes: boolean
  komenciUrl: string
  cloudFunctionsUrl: string
  allowedMtwImplementations: string[]
  currentMtwImplementationAddress: string
  recaptchaSiteKey: string
  bidaliUrl: string
  CIP8AuthorizerUrl: string
  CIP8MetadataUrl: string
  providerFetchUrl: string
  getFiatConnectProvidersUrl: string
  simplexApiUrl: string
  fetchUserLocationDataUrl: string
  komenciLoadCheckEndpoint: string
  walletConnectEndpoint: string
  personaEnvironment: PersonaEnvironment
  inHouseLiquidityURL: string
  setRegistrationPropertiesUrl: string
  fetchExchangesUrl: string
  vendorServiceUrl: string
  firebaseDbUrl: string
}

const VENDOR_CMS_TESTNET = 'https://api.kolektivo.cw/api'
const VENDOR_CMS_MAINNET = 'https://vendors-production-dot-kolektivo-backend.uc.r.appspot.com/api'
const BLOCKCHAIN_API_TESTNET = 'https://alfajores-dot-kolektivo-backend.uc.r.appspot.com'
const BLOCKCHAIN_API_MAINNET = 'https://kolektivo-backend.uc.r.appspot.com'
const KOMENCI_URL_MAINNET = 'https://mainnet-komenci.azurefd.net'
const KOMENCI_URL_STAGING = 'https://staging-komenci.azurefd.net'
const CLOUD_FUNCTIONS_STAGING = 'https://us-central1-celo-mobile-alfajores.cloudfunctions.net'
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

const CIP8_AUTHORIZER_URL_ALFAJORES = 'https://alfajores-stokado.celo-testnet.org/api/authorize'
const CIP8_METADATA_URL_ALFAJORES = 'https://alfajores-stokado-data.celo-testnet.org'
const CIP8_AUTHORIZER_URL_MAINNET = 'https://rc1-stokado.celo-testnet.org/api/authorize'
const CIP8_METADATA_URL_MAINNET = 'https://rc1-stokado-data.celo-testnet.org'

const FETCH_EXCHANGES_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getExchanges`
const FETCH_EXCHANGES_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getExchanges`

const PROVIDER_FETCH_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/fetchProviders`
const PROVIDER_FETCH_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/fetchProviders`

const GET_FIAT_CONNECT_PROVIDERS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getFiatConnectProviders`
const GET_FIAT_CONNECT_PROVIDERS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getFiatConnectProviders`

const SIMPLEX_API_URL_STAGING = `${CLOUD_FUNCTIONS_STAGING}/processSimplexRequest`
const SIMPLEX_API_URL_PROD = `${CLOUD_FUNCTIONS_MAINNET}/processSimplexRequest`

const FETCH_USER_LOCATION_DATA_STAGING = `${CLOUD_FUNCTIONS_STAGING}/fetchUserLocationData`
const FETCH_USER_LOCATION_DATA_PROD = `${CLOUD_FUNCTIONS_MAINNET}/fetchUserLocationData`

const KOMENCI_LOAD_CHECK_ENDPOINT_STAGING = 'https://staging-komenci.azurefd.net/v1/ready'
const KOMENCI_LOAD_CHECK_ENDPOINT_PROD = 'https://mainnet-komenci.azurefd.net/v1/ready'

const SET_REGISTRATION_PROPERTIES_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/setRegistrationProperties`
const SET_REGISTRATION_PROPERTIES_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/setRegistrationProperties`

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Testnets.alfajores]: {
    networkId: '44787',
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: BLOCKCHAIN_API_TESTNET,
    odisUrl: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisPubKey,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
    komenciUrl: KOMENCI_URL_STAGING,
    cloudFunctionsUrl: CLOUD_FUNCTIONS_STAGING,
    allowedMtwImplementations: ALLOWED_MTW_IMPLEMENTATIONS_STAGING,
    currentMtwImplementationAddress: CURRENT_MTW_IMPLEMENTATION_ADDRESS_STAGING,
    CIP8AuthorizerUrl: CIP8_AUTHORIZER_URL_ALFAJORES,
    CIP8MetadataUrl: CIP8_METADATA_URL_ALFAJORES,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    bidaliUrl: BIDALI_URL,
    providerFetchUrl: PROVIDER_FETCH_URL_ALFAJORES,
    getFiatConnectProvidersUrl: GET_FIAT_CONNECT_PROVIDERS_ALFAJORES,
    simplexApiUrl: SIMPLEX_API_URL_STAGING,
    fetchUserLocationDataUrl: FETCH_USER_LOCATION_DATA_STAGING,
    komenciLoadCheckEndpoint: KOMENCI_LOAD_CHECK_ENDPOINT_STAGING,
    walletConnectEndpoint: 'wss://relay.walletconnect.org',
    personaEnvironment: PersonaEnvironment.SANDBOX,
    inHouseLiquidityURL: 'https://liquidity-dot-celo-mobile-alfajores.appspot.com',
    setRegistrationPropertiesUrl: SET_REGISTRATION_PROPERTIES_ALFAJORES,
    fetchExchangesUrl: FETCH_EXCHANGES_URL_ALFAJORES,
    vendorServiceUrl: VENDOR_CMS_TESTNET,
    firebaseDbUrl: FIREBASE_DB_URL,
  },
  [Testnets.mainnet]: {
    networkId: '42220',
    nodeDir: `.${Testnets.mainnet}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: BLOCKCHAIN_API_MAINNET,
    odisUrl: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisPubKey,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
    komenciUrl: KOMENCI_URL_MAINNET,
    cloudFunctionsUrl: CLOUD_FUNCTIONS_MAINNET,
    allowedMtwImplementations: ALLOWED_MTW_IMPLEMENTATIONS_MAINNET,
    currentMtwImplementationAddress: CURRENT_MTW_IMPLEMENTATION_ADDRESS_MAINNET,
    CIP8AuthorizerUrl: CIP8_AUTHORIZER_URL_MAINNET,
    CIP8MetadataUrl: CIP8_METADATA_URL_MAINNET,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    bidaliUrl: BIDALI_URL,
    providerFetchUrl: PROVIDER_FETCH_URL_MAINNET,
    getFiatConnectProvidersUrl: GET_FIAT_CONNECT_PROVIDERS_MAINNET,
    simplexApiUrl: SIMPLEX_API_URL_PROD,
    fetchUserLocationDataUrl: FETCH_USER_LOCATION_DATA_PROD,
    komenciLoadCheckEndpoint: KOMENCI_LOAD_CHECK_ENDPOINT_PROD,
    walletConnectEndpoint: 'wss://relay.walletconnect.org',
    personaEnvironment: PersonaEnvironment.PRODUCTION,
    inHouseLiquidityURL: 'https://liquidity-dot-celo-mobile-mainnet.appspot.com',
    setRegistrationPropertiesUrl: SET_REGISTRATION_PROPERTIES_MAINNET,
    fetchExchangesUrl: FETCH_EXCHANGES_URL_MAINNET,
    vendorServiceUrl: VENDOR_CMS_MAINNET,
    firebaseDbUrl: FIREBASE_DB_URL,
  },
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
