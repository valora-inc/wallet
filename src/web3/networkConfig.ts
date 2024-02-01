import { Environment as PersonaEnvironment } from 'react-native-persona'
import { BIDALI_URL, DEFAULT_FORNO_URL, DEFAULT_TESTNET, RECAPTCHA_SITE_KEY } from 'src/config'
import { Network, NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { Address } from 'viem'
import {
  Chain as ViemChain,
  arbitrum,
  arbitrumSepolia,
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
  getSwapQuoteUrl: string
  walletJumpstartUrl: string
  verifyPhoneNumberUrl: string
  verifySmsCodeUrl: string
  getPublicDEKUrl: string
  lookupPhoneNumberUrl: string
  lookupAddressUrl: string
  checkAddressVerifiedUrl: string
  revokePhoneNumberUrl: string
  migratePhoneVerificationUrl: string
  fetchAvailableSuperchargeRewards: string
  resolveId: string
  getNftsByOwnerAddressUrl: string
  cabIssueSmsCodeUrl: string
  cabIssueValoraKeyshareUrl: string
  cabStoreEncryptedMnemonicUrl: string
  cabGetEncryptedMnemonicUrl: string
  cabLoginUrl: string
  cabClockUrl: string
  networkToNetworkId: Record<Network, NetworkId>
  defaultNetworkId: NetworkId
  getTokensInfoUrl: string
  viemChain: {
    [key in Network]: ViemChain
  }
  currencyToTokenId: {
    [key in CiCoCurrency | Currency]: string
  }
  celoTokenAddress: Address
  celoGasPriceMinimumAddress: Address
  alchemyRpcUrl: Partial<Record<Network, string>>
  cusdTokenId: string
  ceurTokenId: string
  crealTokenId: string
  celoTokenId: string
  spendTokenIds: string[]
  saveContactsUrl: string
}

const ALCHEMY_ETHEREUM_RPC_URL_STAGING = 'https://eth-sepolia.g.alchemy.com/v2/'
const ALCHEMY_ETHEREUM_RPC_URL_MAINNET = 'https://eth-mainnet.g.alchemy.com/v2/'

const ALCHEMY_ARBITRUM_RPC_URL_STAGING = 'https://arb-sepolia.g.alchemy.com/v2/'
const ALCHEMY_ARBITRUM_RPC_URL_MAINNET = 'https://arb-mainnet.g.alchemy.com/v2/'

export type BlockExplorerUrls = {
  [key in NetworkId]: {
    baseTxUrl: string
    baseAddressUrl: string
    baseTokenUrl: string
    baseNftUrl: string
  }
}

export type NetworkIdToNetwork = {
  [key in NetworkId]: Network
}

const CELO_TOKEN_ADDRESS_STAGING = '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9'
const CELO_TOKEN_ADDRESS_MAINNET = '0x471ece3750da237f93b8e339c536989b8978a438'

// From https://docs.celo.org/contract-addresses
const CELO_GAS_PRICE_MINIMUM_ADDRESS_STAGING = '0xd0bf87a5936ee17014a057143a494dc5c5d51e5e'
const CELO_GAS_PRICE_MINIMUM_ADDRESS_MAINNET = '0xdfca3a8d7699d8bafe656823ad60c17cb8270ecc'

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

const CHECK_ADDRESS_VERIFIED_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/checkAddressVerified`
const CHECK_ADDRESS_VERIFIED_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/checkAddressVerified`

const FETCH_AVAILABLE_SUPERCHARGE_REWARDS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getSuperchargeRewards`
const FETCH_AVAILABLE_SUPERCHARGE_REWARDS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getSuperchargeRewards`

const RESOLVE_ID_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/resolveId`
const RESOLVE_ID_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/resolveId`

const NFTS_VALORA_APP_URL = 'https://nfts.valoraapp.com/'

const GET_SWAP_QUOTE_URL = `${CLOUD_FUNCTIONS_MAINNET}/getSwapQuote`

const HOOKS_API_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/hooks-api`
const HOOKS_API_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/hooks-api`

const JUMPSTART_CLAIM_URL_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/walletJumpstart`
const JUMPSTART_CLAIM_URL_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/walletJumpstart`

const GET_NFTS_BY_OWNER_ADDRESS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getNfts`
const GET_NFTS_BY_OWNER_ADDRESS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getNfts`

const CAB_ISSUE_SMS_CODE_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/issueSmsCode`
const CAB_ISSUE_SMS_CODE_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/issueSmsCode`
const CAB_STORE_ENCRYPTED_MNEMONIC_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/storeEncryptedMnemonic`
const CAB_STORE_ENCRYPTED_MNEMONIC_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/storeEncryptedMnemonic`

const CAB_ISSUE_VALORA_KEYSHARE_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/issueValoraKeyshare`
const CAB_ISSUE_VALORA_KEYSHARE_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/issueValoraKeyshare`

const CAB_LOGIN_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/cloudBackupLogin`
const CAB_LOGIN_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/cloudBackupLogin`

const CAB_CLOCK_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/clock`
const CAB_CLOCK_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/clock`

const CAB_GET_ENCRYPTED_MNEMONIC_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/getEncryptedMnemonic`
const CAB_GET_ENCRYPTED_MNEMONIC_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/getEncryptedMnemonic`

const SAVE_CONTACTS_ALFAJORES = `${CLOUD_FUNCTIONS_STAGING}/saveContacts`
const SAVE_CONTACTS_MAINNET = `${CLOUD_FUNCTIONS_MAINNET}/saveContacts`

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Testnets.alfajores]: {
    networkId: '44787',
    networkToNetworkId: {
      [Network.Celo]: NetworkId['celo-alfajores'],
      [Network.Ethereum]: NetworkId['ethereum-sepolia'],
      [Network.Arbitrum]: NetworkId['arbitrum-sepolia'],
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
    getSwapQuoteUrl: GET_SWAP_QUOTE_URL,
    walletJumpstartUrl: JUMPSTART_CLAIM_URL_ALFAJORES,
    verifyPhoneNumberUrl: VERIFY_PHONE_NUMBER_ALFAJORES,
    verifySmsCodeUrl: VERIFY_SMS_CODE_ALFAJORES,
    getPublicDEKUrl: GET_PUBLIC_DEK_ALFAJORES,
    lookupPhoneNumberUrl: LOOKUP_PHONE_NUMBER_ALFAJORES,
    lookupAddressUrl: LOOKUP_ADDRESS_ALFAJORES,
    checkAddressVerifiedUrl: CHECK_ADDRESS_VERIFIED_ALFAJORES,
    revokePhoneNumberUrl: REVOKE_PHONE_NUMBER_ALFAJORES,
    migratePhoneVerificationUrl: MIGRATE_PHONE_VERIFICATION_ALFAJORES,
    fetchAvailableSuperchargeRewards: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_ALFAJORES,
    resolveId: RESOLVE_ID_ALFAJORES,
    getNftsByOwnerAddressUrl: GET_NFTS_BY_OWNER_ADDRESS_ALFAJORES,
    cabIssueSmsCodeUrl: CAB_ISSUE_SMS_CODE_ALFAJORES,
    cabIssueValoraKeyshareUrl: CAB_ISSUE_VALORA_KEYSHARE_ALFAJORES,
    cabStoreEncryptedMnemonicUrl: CAB_STORE_ENCRYPTED_MNEMONIC_ALFAJORES,
    cabGetEncryptedMnemonicUrl: CAB_GET_ENCRYPTED_MNEMONIC_ALFAJORES,
    cabLoginUrl: CAB_LOGIN_ALFAJORES,
    cabClockUrl: CAB_CLOCK_ALFAJORES,
    getTokensInfoUrl: GET_TOKENS_INFO_URL_ALFAJORES,
    viemChain: {
      [Network.Celo]: celoAlfajores,
      [Network.Ethereum]: ethereumSepolia,
      [Network.Arbitrum]: arbitrumSepolia,
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
    celoGasPriceMinimumAddress: CELO_GAS_PRICE_MINIMUM_ADDRESS_STAGING,
    alchemyRpcUrl: {
      [Network.Ethereum]: ALCHEMY_ETHEREUM_RPC_URL_STAGING,
      [Network.Arbitrum]: ALCHEMY_ARBITRUM_RPC_URL_STAGING,
    },
    cusdTokenId: CUSD_TOKEN_ID_STAGING,
    ceurTokenId: CEUR_TOKEN_ID_STAGING,
    crealTokenId: CREAL_TOKEN_ID_STAGING,
    celoTokenId: CELO_TOKEN_ID_STAGING,
    spendTokenIds: [CUSD_TOKEN_ID_STAGING, CEUR_TOKEN_ID_STAGING],
    saveContactsUrl: SAVE_CONTACTS_ALFAJORES,
  },
  [Testnets.mainnet]: {
    networkId: '42220',
    networkToNetworkId: {
      [Network.Celo]: NetworkId['celo-mainnet'],
      [Network.Ethereum]: NetworkId['ethereum-mainnet'],
      [Network.Arbitrum]: NetworkId['arbitrum-one'],
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
    getSwapQuoteUrl: GET_SWAP_QUOTE_URL,
    walletJumpstartUrl: JUMPSTART_CLAIM_URL_MAINNET,
    verifyPhoneNumberUrl: VERIFY_PHONE_NUMBER_MAINNET,
    verifySmsCodeUrl: VERIFY_SMS_CODE_MAINNET,
    getPublicDEKUrl: GET_PUBLIC_DEK_MAINNET,
    lookupPhoneNumberUrl: LOOKUP_PHONE_NUMBER_MAINNET,
    lookupAddressUrl: LOOKUP_ADDRESS_MAINNET,
    checkAddressVerifiedUrl: CHECK_ADDRESS_VERIFIED_MAINNET,
    revokePhoneNumberUrl: REVOKE_PHONE_NUMBER_MAINNET,
    migratePhoneVerificationUrl: MIGRATE_PHONE_VERIFICATION_MAINNET,
    fetchAvailableSuperchargeRewards: FETCH_AVAILABLE_SUPERCHARGE_REWARDS_MAINNET,
    resolveId: RESOLVE_ID_MAINNET,
    getNftsByOwnerAddressUrl: GET_NFTS_BY_OWNER_ADDRESS_MAINNET,
    cabIssueSmsCodeUrl: CAB_ISSUE_SMS_CODE_MAINNET,
    cabIssueValoraKeyshareUrl: CAB_ISSUE_VALORA_KEYSHARE_MAINNET,
    cabStoreEncryptedMnemonicUrl: CAB_STORE_ENCRYPTED_MNEMONIC_MAINNET,
    cabGetEncryptedMnemonicUrl: CAB_GET_ENCRYPTED_MNEMONIC_MAINNET,
    cabLoginUrl: CAB_LOGIN_MAINNET,
    cabClockUrl: CAB_CLOCK_MAINNET,
    getTokensInfoUrl: GET_TOKENS_INFO_URL_MAINNET,
    viemChain: {
      [Network.Celo]: celo,
      [Network.Ethereum]: ethereum,
      [Network.Arbitrum]: arbitrum,
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
    celoGasPriceMinimumAddress: CELO_GAS_PRICE_MINIMUM_ADDRESS_MAINNET,
    alchemyRpcUrl: {
      [Network.Ethereum]: ALCHEMY_ETHEREUM_RPC_URL_MAINNET,
      [Network.Arbitrum]: ALCHEMY_ARBITRUM_RPC_URL_MAINNET,
    },
    cusdTokenId: CUSD_TOKEN_ID_MAINNET,
    ceurTokenId: CEUR_TOKEN_ID_MAINNET,
    crealTokenId: CREAL_TOKEN_ID_MAINNET,
    celoTokenId: CELO_TOKEN_ID_MAINNET,
    spendTokenIds: [CUSD_TOKEN_ID_MAINNET, CEUR_TOKEN_ID_MAINNET],
    saveContactsUrl: SAVE_CONTACTS_MAINNET,
  },
}

const CELOSCAN_BASE_URL_ALFAJORES = 'https://alfajores.celoscan.io'
const CELOSCAN_BASE_URL_MAINNET = 'https://celoscan.io'

const ETHERSCAN_BASE_URL_SEPOLIA = 'https://sepolia.etherscan.io'
const ETHERSCAN_BASE_URL_MAINNET = 'https://etherscan.io'

const ARBISCAN_BASE_URL_ONE = 'https://arbiscan.io'
const ARBISCAN_BASE_URL_SEPOLIA = 'https://sepolia.arbiscan.io'

export const blockExplorerUrls: BlockExplorerUrls = {
  [NetworkId['celo-mainnet']]: {
    baseTxUrl: `${CELOSCAN_BASE_URL_MAINNET}/tx/`,
    baseAddressUrl: `${CELOSCAN_BASE_URL_MAINNET}/address/`,
    baseTokenUrl: `${CELOSCAN_BASE_URL_MAINNET}/token/`,
    baseNftUrl: 'https://explorer.celo.org/mainnet/token/',
  },
  [NetworkId['celo-alfajores']]: {
    baseTxUrl: `${CELOSCAN_BASE_URL_ALFAJORES}/tx/`,
    baseAddressUrl: `${CELOSCAN_BASE_URL_ALFAJORES}/address/`,
    baseTokenUrl: `${CELOSCAN_BASE_URL_ALFAJORES}/token/`,
    baseNftUrl: 'https://explorer.celo.org/alfajores/token/',
  },
  [NetworkId['ethereum-mainnet']]: {
    baseTxUrl: `${ETHERSCAN_BASE_URL_MAINNET}/tx/`,
    baseAddressUrl: `${ETHERSCAN_BASE_URL_MAINNET}/address/`,
    baseTokenUrl: `${ETHERSCAN_BASE_URL_MAINNET}/token/`,
    baseNftUrl: `${ETHERSCAN_BASE_URL_MAINNET}/nft/`,
  },
  [NetworkId['ethereum-sepolia']]: {
    baseTxUrl: `${ETHERSCAN_BASE_URL_SEPOLIA}/tx/`,
    baseAddressUrl: `${ETHERSCAN_BASE_URL_SEPOLIA}/address/`,
    baseTokenUrl: `${ETHERSCAN_BASE_URL_SEPOLIA}/token/`,
    baseNftUrl: `${ETHERSCAN_BASE_URL_SEPOLIA}/nft/`,
  },
  [NetworkId['arbitrum-one']]: {
    baseTxUrl: `${ARBISCAN_BASE_URL_ONE}/txs/`,
    baseAddressUrl: `${ARBISCAN_BASE_URL_ONE}/address/`,
    baseTokenUrl: `${ARBISCAN_BASE_URL_ONE}/token/`,
    baseNftUrl: `${ARBISCAN_BASE_URL_ONE}/token/`,
  },
  [NetworkId['arbitrum-sepolia']]: {
    baseTxUrl: `${ARBISCAN_BASE_URL_SEPOLIA}/txs/`,
    baseAddressUrl: `${ARBISCAN_BASE_URL_SEPOLIA}/address/`,
    baseTokenUrl: `${ARBISCAN_BASE_URL_SEPOLIA}/token/`,
    baseNftUrl: `${ARBISCAN_BASE_URL_SEPOLIA}/token/`,
  },
}

export const networkIdToNetwork: NetworkIdToNetwork = {
  [NetworkId['celo-mainnet']]: Network.Celo,
  [NetworkId['celo-alfajores']]: Network.Celo,
  [NetworkId['ethereum-mainnet']]: Network.Ethereum,
  [NetworkId['ethereum-sepolia']]: Network.Ethereum,
  [NetworkId['arbitrum-one']]: Network.Arbitrum,
  [NetworkId['arbitrum-sepolia']]: Network.Arbitrum,
}

export const networkIdToWalletConnectChainId: Record<NetworkId, string> = {
  [NetworkId['celo-alfajores']]: 'eip155:44787',
  [NetworkId['celo-mainnet']]: 'eip155:42220',
  [NetworkId['ethereum-mainnet']]: 'eip155:1',
  [NetworkId['ethereum-sepolia']]: 'eip155:11155111',
  [NetworkId['arbitrum-one']]: 'eip155:42161',
  [NetworkId['arbitrum-sepolia']]: 'eip155:421614',
}

export const walletConnectChainIdToNetworkId: Record<string, NetworkId> = {
  'eip155:44787': NetworkId['celo-alfajores'],
  'eip155:42220': NetworkId['celo-mainnet'],
  'eip155:1': NetworkId['ethereum-mainnet'],
  'eip155:11155111': NetworkId['ethereum-sepolia'],
  'eip155:42161': NetworkId['arbitrum-one'],
  'eip155:421614': NetworkId['arbitrum-sepolia'],
}

export const walletConnectChainIdToNetwork: Record<string, Network> = {
  'eip155:44787': Network.Celo,
  'eip155:42220': Network.Celo,
  'eip155:1': Network.Ethereum,
  'eip155:11155111': Network.Ethereum,
  'eip155:42161': Network.Arbitrum,
  'eip155:421614': Network.Arbitrum,
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
