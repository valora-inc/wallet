import { Address } from '@celo/base'
import { Environment as PersonaEnvironment } from 'react-native-persona'
import { BIDALI_URL, DEFAULT_FORNO_URL, DEFAULT_TESTNET, RECAPTCHA_SITE_KEY } from 'src/config'
import { Network, NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import {
  Chain as ViemChain,
  celo,
  celoAlfajores,
  mainnet as ethereum,
  sepolia as ethereumSepolia,
} from 'viem/chains'

export enum Testnets {
  alfajores = 'alfajores',
  mainnet = 'mainnet',
}

interface NetworkConfig {
  networkId: string
  blockchainApiUrl: string
  cloudFunctionsUrl: string
  hooksApiUrl: string
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
  walletConnectEndpoint: string
  personaEnvironment: PersonaEnvironment
  inHouseLiquidityURL: string
  setRegistrationPropertiesUrl: string
  fetchExchangesUrl: string
  nftsValoraAppUrl: string
  celoExplorerBaseTokenUrl: string
  celoExplorerBaseTxUrl: string
  celoExplorerBaseAddressUrl: string
  approveSwapUrl: string
  walletJumpstartUrl: string
  walletJumpstartAddress: string
  verifyPhoneNumberUrl: string
  verifySmsCodeUrl: string
  getPublicDEKUrl: string
  lookupPhoneNumberUrl: string
  lookupAddressUrl: string
  revokePhoneNumberUrl: string
  migratePhoneVerificationUrl: string
  fetchAvailableSuperchargeRewards: string
  fetchAvailableSuperchargeRewardsV2: string
  resolveId: string
  getNftsByOwnerAddressUrl: string
  cabIssueSmsCodeUrl: string
  cabIssueValoraKeyshareUrl: string
  cabStoreEncryptedMnemonicUrl: string
  networkToNetworkId: Record<Network, NetworkId>
  defaultNetworkId: NetworkId
  getTokensInfoUrl: string
  viemChain: {
    [key in Network]: ViemChain
  }
  currencyToTokenId: {
    [key in CiCoCurrency | Currency]: string
  }
  celoTokenAddress: string
  alchemyEthereumRpcUrl: string
}

const ALCHEMY_ETHEREUM_RPC_URL_STAGING = 'https://eth-sepolia.g.alchemy.com/v2/'
const ALCHEMY_ETHEREUM_RPC_URL_MAINNET = 'https://eth-mainnet.g.alchemy.com/v2/'

export type blockExplorerUrls = {
  [key in NetworkId]: { baseTxUrl: string }
}

export type NetworkIdToNetwork = {
  [key in NetworkId]: Network
}

const CELO_TOKEN_ADDRESS_STAGING = '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9'
const CELO_TOKEN_ADDRESS_MAINNET = '0x471ece3750da237f93b8e339c536989b8978a438'

const CELO_TOKEN_ID_STAGING = `${NetworkId['celo-alfajores']}:native`
const CELO_TOKEN_ID_MAINNET = `${NetworkId['celo-mainnet']}:native`

const CUSD_TOKEN_ID_STAGING = `${NetworkId['celo-alfajores']}:0x874069fa1eb16d44d622f2e0ca25eea172369bc1`
const CUSD_TOKEN_ID_MAINNET = `${NetworkId['celo-mainnet']}:0x765de816845861e75a25fca122bb6898b8b1282a`

const CEUR_TOKEN_ID_STAGING = `${NetworkId['celo-alfajores']}:0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f`
const CEUR_TOKEN_ID_MAINNET = `${NetworkId['celo-mainnet']}:0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73`

const CREAL_TOKEN_ID_STAGING = `${NetworkId['celo-alfajores']}:0xe4d517785d091d3c54818832db6094bcc2744545`
const CREAL_TOKEN_ID_MAINNET = `${NetworkId['celo-mainnet']}:0xe8537a3d056da446677b9e9d6c5db704eaab4787`

const ETH_TOKEN_ID_STAGING = `${NetworkId['ethereum-sepolia']}:native`
const ETH_TOKEN_ID_MAINNET = `${NetworkId['ethereum-mainnet']}:native`

const CLOUD_FUNCTIONS_STAGING = 'https://api.alfajores.valora.xyz'
const CLOUD_FUNCTIONS_MAINNET = 'https://api.mainnet.valora.xyz'

const BLOCKCHAIN_API_STAGING = 'https://blockchain-api-dot-celo-mobile-alfajores.appspot.com'
const BLOCKCHAIN_API_MAINNET = 'https://blockchain-api-dot-celo-mobile-mainnet.appspot.com'

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

const GET_TOKENS_INFO_URL_ALFAJORES = `${BLOCKCHAIN_API_STAGING}/tokensInfo`
const GET_TOKENS_INFO_URL_MAINNET = `${BLOCKCHAIN_API_MAINNET}/tokensInfo`

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
const FETCH_AVAILABLE_SUPERCHARGE_REWARDS_ALFAJORES_V2 = `${CLOUD_FUNCTIONS_STAGING}/getSuperchargeRewards`
const FETCH_AVAILABLE_SUPERCHARGE_REWARDS_MAINNET_V2 = `${CLOUD_FUNCTIONS_MAINNET}/getSuperchargeRewards`

const RESOLVE_ID_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/resolveId`
const RESOLVE_ID_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/resolveId`

const CELO_EXPLORER_BASE_URL_ALFAJORES = 'https://explorer.celo.org/alfajores'
const CELO_EXPLORER_BASE_URL_MAINNET = 'https://explorer.celo.org/mainnet'

const CELO_EXPLORER_BASE_TX_URL_ALFAJORES = `${CELO_EXPLORER_BASE_URL_ALFAJORES}/tx/`
const CELO_EXPLORER_BASE_TX_URL_MAINNET = `${CELO_EXPLORER_BASE_URL_MAINNET}/tx/`

const CELO_EXPLORER_BASE_ADDRESS_URL_ALFAJORES = `${CELO_EXPLORER_BASE_URL_ALFAJORES}/address/`
const CELO_EXPLORER_BASE_ADDRESS_URL_MAINNET = `${CELO_EXPLORER_BASE_URL_MAINNET}/address/`

const CELO_EXPLORER_BASE_TOKEN_URL_ALFAJORES = `${CELO_EXPLORER_BASE_URL_ALFAJORES}/token/`
const CELO_EXPLORER_BASE_TOKEN_URL_MAINNET = `${CELO_EXPLORER_BASE_URL_MAINNET}/token/`

const ETH_EXPLORER_BASE_URL_SEPOLIA = 'https://sepolia.etherscan.io'
const ETH_EXPLORER_BASE_URL_MAINNET = 'https://etherscan.io'

const ETH_EXPLORER_BASE_TX_URL_SEPOLIA = `${ETH_EXPLORER_BASE_URL_SEPOLIA}/tx/`
const ETH_EXPLORER_BASE_TX_URL_MAINNET = `${ETH_EXPLORER_BASE_URL_MAINNET}/tx/`

const NFTS_VALORA_APP_URL = 'https://nfts.valoraapp.com/'

const APPROVE_SWAP_URL = `${CLOUD_FUNCTIONS_MAINNET}/approveSwap`

const HOOKS_API_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/hooks-api`
const HOOKS_API_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/hooks-api`

const JUMPSTART_CLAIM_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/walletJumpstart`
const JUMPSTART_CLAIM_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/walletJumpstart`

const JUMPSTART_ADDRESS_ALFAJORES = '0xf25a016E53644EEfe4A167Ff05482213BCd627ED'
const JUMPSTART_ADDRESS_MAINNET = '0x22Bac00dB51FfD2eb5a02e58974b64726c684BaA'

const GET_NFTS_BY_OWNER_ADDRESS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getNfts`
const GET_NFTS_BY_OWNER_ADDRESS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getNfts`

const CAB_ISSUE_SMS_CODE_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/issueSmsCode`
const CAB_ISSUE_SMS_CODE_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/issueSmsCode`
const CAB_STORE_ENCRYPTED_MNEMONIC_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/storeEncryptedMnemonic`
const CAB_STORE_ENCRYPTED_MNEMONIC_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/storeEncryptedMnemonic`

const CAB_ISSUE_VALORA_KEYSHARE_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/issueValoraKeyshare`
const CAB_ISSUE_VALORA_KEYSHARE_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/issueValoraKeyshare`

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Testnets.alfajores]: {
    networkId: '44787',
    networkToNetworkId: {
      [Network.Celo]: NetworkId['celo-alfajores'],
      [Network.Ethereum]: NetworkId['ethereum-sepolia'],
    },
    defaultNetworkId: NetworkId['celo-alfajores'],
    // blockchainApiUrl: 'http://127.0.0.1:8080',
    blockchainApiUrl: BLOCKCHAIN_API_STAGING,
    cloudFunctionsUrl: CLOUD_FUNCTIONS_STAGING,
    hooksApiUrl: HOOKS_API_URL_ALFAJORES,
    sentryTracingUrls: [
      DEFAULT_FORNO_URL,
      BLOCKCHAIN_API_STAGING,
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
    walletConnectEndpoint: 'wss://relay.walletconnect.org',
    personaEnvironment: PersonaEnvironment.SANDBOX,
    inHouseLiquidityURL: 'https://liquidity-dot-celo-mobile-alfajores.appspot.com',
    setRegistrationPropertiesUrl: SET_REGISTRATION_PROPERTIES_ALFAJORES,
    fetchExchangesUrl: FETCH_EXCHANGES_URL_ALFAJORES,
    nftsValoraAppUrl: NFTS_VALORA_APP_URL,
    celoExplorerBaseTokenUrl: CELO_EXPLORER_BASE_TOKEN_URL_ALFAJORES,
    celoExplorerBaseTxUrl: CELO_EXPLORER_BASE_TX_URL_ALFAJORES,
    celoExplorerBaseAddressUrl: CELO_EXPLORER_BASE_ADDRESS_URL_ALFAJORES,
    approveSwapUrl: APPROVE_SWAP_URL,
    walletJumpstartUrl: JUMPSTART_CLAIM_URL_ALFAJORES,
    walletJumpstartAddress: JUMPSTART_ADDRESS_ALFAJORES,
    verifyPhoneNumberUrl: VERIFY_PHONE_NUMBER_ALFAJORES,
    verifySmsCodeUrl: VERIFY_SMS_CODE_ALFAJORES,
    getPublicDEKUrl: GET_PUBLIC_DEK_ALFAJORES,
    lookupPhoneNumberUrl: LOOKUP_PHONE_NUMBER_ALFAJORES,
    lookupAddressUrl: LOOKUP_ADDRESS_ALFAJORES,
    revokePhoneNumberUrl: REVOKE_PHONE_NUMBER_ALFAJORES,
    migratePhoneVerificationUrl: MIGRATE_PHONE_VERIFICATION_ALFAJORES,
    fetchAvailableSuperchargeRewards: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_ALFAJORES,
    fetchAvailableSuperchargeRewardsV2: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_ALFAJORES_V2,
    resolveId: RESOLVE_ID_ALFAJORES,
    getNftsByOwnerAddressUrl: GET_NFTS_BY_OWNER_ADDRESS_ALFAJORES,
    cabIssueSmsCodeUrl: CAB_ISSUE_SMS_CODE_ALFAJORES,
    cabIssueValoraKeyshareUrl: CAB_ISSUE_VALORA_KEYSHARE_ALFAJORES,
    cabStoreEncryptedMnemonicUrl: CAB_STORE_ENCRYPTED_MNEMONIC_ALFAJORES,
    getTokensInfoUrl: GET_TOKENS_INFO_URL_ALFAJORES,
    viemChain: {
      [Network.Celo]: celoAlfajores,
      [Network.Ethereum]: ethereumSepolia,
    },
    currencyToTokenId: {
      [CiCoCurrency.CELO]: CELO_TOKEN_ID_STAGING,
      [CiCoCurrency.cUSD]: CUSD_TOKEN_ID_STAGING,
      [CiCoCurrency.cEUR]: CEUR_TOKEN_ID_STAGING,
      [CiCoCurrency.cREAL]: CREAL_TOKEN_ID_STAGING,
      [CiCoCurrency.ETH]: ETH_TOKEN_ID_STAGING,
      [Currency.Celo]: CELO_TOKEN_ID_STAGING,
    },
    celoTokenAddress: CELO_TOKEN_ADDRESS_STAGING,
    alchemyEthereumRpcUrl: ALCHEMY_ETHEREUM_RPC_URL_STAGING,
  },
  [Testnets.mainnet]: {
    networkId: '42220',
    networkToNetworkId: {
      [Network.Celo]: NetworkId['celo-mainnet'],
      [Network.Ethereum]: NetworkId['ethereum-mainnet'],
    },
    defaultNetworkId: NetworkId['celo-mainnet'],
    blockchainApiUrl: BLOCKCHAIN_API_MAINNET,
    cloudFunctionsUrl: CLOUD_FUNCTIONS_MAINNET,
    hooksApiUrl: HOOKS_API_URL_MAINNET,
    sentryTracingUrls: [
      DEFAULT_FORNO_URL,
      BLOCKCHAIN_API_MAINNET,
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
    walletConnectEndpoint: 'wss://relay.walletconnect.org',
    personaEnvironment: PersonaEnvironment.PRODUCTION,
    inHouseLiquidityURL: 'https://liquidity-dot-celo-mobile-mainnet.appspot.com',
    setRegistrationPropertiesUrl: SET_REGISTRATION_PROPERTIES_MAINNET,
    fetchExchangesUrl: FETCH_EXCHANGES_URL_MAINNET,
    nftsValoraAppUrl: NFTS_VALORA_APP_URL,
    celoExplorerBaseTokenUrl: CELO_EXPLORER_BASE_TOKEN_URL_MAINNET,
    celoExplorerBaseTxUrl: CELO_EXPLORER_BASE_TX_URL_MAINNET,
    celoExplorerBaseAddressUrl: CELO_EXPLORER_BASE_ADDRESS_URL_MAINNET,
    approveSwapUrl: APPROVE_SWAP_URL,
    walletJumpstartUrl: JUMPSTART_CLAIM_URL_MAINNET,
    walletJumpstartAddress: JUMPSTART_ADDRESS_MAINNET,
    verifyPhoneNumberUrl: VERIFY_PHONE_NUMBER_MAINNET,
    verifySmsCodeUrl: VERIFY_SMS_CODE_MAINNET,
    getPublicDEKUrl: GET_PUBLIC_DEK_MAINNET,
    lookupPhoneNumberUrl: LOOKUP_PHONE_NUMBER_MAINNET,
    lookupAddressUrl: LOOKUP_ADDRESS_MAINNET,
    revokePhoneNumberUrl: REVOKE_PHONE_NUMBER_MAINNET,
    migratePhoneVerificationUrl: MIGRATE_PHONE_VERIFICATION_MAINNET,
    fetchAvailableSuperchargeRewards: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_MAINNET,
    fetchAvailableSuperchargeRewardsV2: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_MAINNET_V2,
    resolveId: RESOLVE_ID_MAINNET,
    getNftsByOwnerAddressUrl: GET_NFTS_BY_OWNER_ADDRESS_MAINNET,
    cabIssueSmsCodeUrl: CAB_ISSUE_SMS_CODE_MAINNET,
    cabIssueValoraKeyshareUrl: CAB_ISSUE_VALORA_KEYSHARE_MAINNET,
    cabStoreEncryptedMnemonicUrl: CAB_STORE_ENCRYPTED_MNEMONIC_MAINNET,
    getTokensInfoUrl: GET_TOKENS_INFO_URL_MAINNET,
    viemChain: {
      [Network.Celo]: celo,
      [Network.Ethereum]: ethereum,
    },
    currencyToTokenId: {
      [CiCoCurrency.CELO]: CELO_TOKEN_ID_MAINNET,
      [CiCoCurrency.cUSD]: CUSD_TOKEN_ID_MAINNET,
      [CiCoCurrency.cEUR]: CEUR_TOKEN_ID_MAINNET,
      [CiCoCurrency.cREAL]: CREAL_TOKEN_ID_MAINNET,
      [CiCoCurrency.ETH]: ETH_TOKEN_ID_MAINNET,
      [Currency.Celo]: CELO_TOKEN_ID_MAINNET,
    },
    celoTokenAddress: CELO_TOKEN_ADDRESS_MAINNET,
    alchemyEthereumRpcUrl: ALCHEMY_ETHEREUM_RPC_URL_MAINNET,
  },
}

export const blockExplorerUrls: blockExplorerUrls = {
  [NetworkId['celo-mainnet']]: { baseTxUrl: CELO_EXPLORER_BASE_TX_URL_MAINNET },
  [NetworkId['celo-alfajores']]: { baseTxUrl: CELO_EXPLORER_BASE_TX_URL_ALFAJORES },
  [NetworkId['ethereum-mainnet']]: { baseTxUrl: ETH_EXPLORER_BASE_TX_URL_MAINNET },
  [NetworkId['ethereum-sepolia']]: { baseTxUrl: ETH_EXPLORER_BASE_TX_URL_SEPOLIA },
}

export const networkIdToNetwork: NetworkIdToNetwork = {
  [NetworkId['celo-mainnet']]: Network.Celo,
  [NetworkId['celo-alfajores']]: Network.Celo,
  [NetworkId['ethereum-mainnet']]: Network.Ethereum,
  [NetworkId['ethereum-sepolia']]: Network.Ethereum,
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
