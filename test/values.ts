/* Shared mock values to facilitate testing */
import { UnlockableWallet } from '@celo/wallet-base'
import {
  CryptoType,
  FeeFrequency,
  FiatAccountSchema,
  FiatConnectError,
  FiatType,
  KycSchema,
  FeeType as QuoteFeeType,
  TransferType,
} from '@fiatconnect/fiatconnect-types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { range } from 'lodash'
import { MinimalContact } from 'react-native-contacts'
import { Dapp, DappWithCategoryNames } from 'src/dapps/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { FeeType } from 'src/fees/reducer'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { ProviderSelectionAnalyticsData } from 'src/fiatExchanges/types'
import {
  FetchProvidersOutput,
  LegacyMobileMoneyProvider,
  PaymentMethod,
} from 'src/fiatExchanges/utils'
import {
  FiatConnectProviderInfo,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
  GetFiatConnectQuotesResponse,
} from 'src/fiatconnect'
import { CleverTapInboxMessage } from 'src/home/cleverTapInbox'
import { NftCelebrationStatus } from 'src/home/reducers'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { StackParamList } from 'src/navigator/types'
import { Nft, NftWithMetadata } from 'src/nfts/types'
import { Position, Shortcut } from 'src/positions/types'
import { PriceHistoryStatus } from 'src/priceHistory/slice'
import { UriData } from 'src/qrcode/schema'
import {
  AddressRecipient,
  AddressToRecipient,
  ContactRecipient,
  MobileRecipient,
  NumberToRecipient,
  RecipientInfo,
  RecipientType,
} from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/types'
import { NativeTokenBalance, StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import {
  NetworkId,
  TokenApproval,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

export const nullAddress = '0x0'

export const mockName = 'John Doe'
export const mockAccount = '0x0000000000000000000000000000000000007E57'
export const mockAccount2 = '0x1Ff482D42D8727258A1686102Fa4ba925C46Bc42'
export const mockAccount3 = '0x1230000000000000000000000000000000007E57'

export const mockMnemonic =
  'prosper winner find donate tape history measure umbrella agent patrol want rhythm old unable wash wrong need fluid hammer coach reveal plastic trust lake'
export const mockTwelveWordMnemonic =
  'prosper winner find donate tape history measure umbrella agent patrol want rhythm'

export const mockMnemonicShard1 =
  'prosper winner find donate tape history measure umbrella agent patrol want rhythm celo'
export const mockMnemonicShard2 =
  'celo old unable wash wrong need fluid hammer coach reveal plastic trust lake'

export const mockPrivateDEK = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'
export const mockPublicDEK = '02c9cacca8c5c5ebb24dc6080a933f6d52a072136a069083438293d71da36049dc'
export const mockDEKAddress = '0xa81a5f8c5894676fc11c0e3b6f75aa89cf117240'
export const mockPrivateDEK2 = '855c5f9d5fc53962537eaf9a0f3ea40a7bc7e57a119e8473fffef24be20bffff'
export const mockPublicDEK2 = '024c158e98449d9ca4dddeaa12c2432a5e7d38a48a53299fd22c51daf8d409957a'
export const mockDEKAddress2 = '0x5fB37627975be239eDaf3A41852A12E7cd3965d1'

export const mockContractAddress = '0x000000000000000000000000000000000000CE10'
export const mockE164Number = '+14155550000'
export const mockDisplayNumber = '(415) 555-0000'
export const mockE164NumberHash =
  '0xefbc804cdddcb76544e1dd2c25e9624edae290d175ccd20538e5cae06c7dbe9e'
export const mockE164NumberPepper = 'piWqRHHYWtfg9'
export const mockE164NumberHashWithPepper =
  '0xf6429456331dedf8bd32b5e3a578e5bc589a28d012724dcd3e0a4b1be67bb454'

export const mockE164Number2 = '+12095559790'
export const mockDisplayNumber2 = '+1 209-555-9790'
export const mockComment = 'Rent request for June, it is already late!!!'
export const mockCountryCode = '+1'

export const mockE164Number3 = '+14155550123'

export const mockQrCodeData = {
  address: mockAccount,
  e164PhoneNumber: mockE164Number,
  displayName: mockName,
}

export const mockNameInvite = 'Jane Doe'
export const mockName2Invite = 'George Bogart'
export const mockE164NumberInvite = '+13105550000'
export const mockDisplayNumberInvite = '13105550000'
export const mockE164Number2Invite = '+442012341234'
export const mockDisplayNumber2Invite = '442012341234'
export const mockAccountInvite = '0x9335BaFcE54cAa0D6690d1D4DA6406568b52488F'
export const mockAccountInvitePrivKey =
  '0xe59c12feb5ea13dabcc068a28d1d521a26e39464faa7bbcc01f43b8340e92fa6'
export const mockAccount2Invite = '0x8e1Df47B7064D005Ef071a89D0D7dc8634BC8A9C'
export const mockAccountInvite2PrivKey =
  '0xb33eac631fd3a415f3738649db8cad57da78b99ec92cd8f77b76b5dae2ebdf27'

export const mockCusdAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'.toLowerCase()
export const mockCeurAddress = '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F'.toLowerCase()
export const mockCeloAddress = '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9'.toLowerCase()
export const mockPoofAddress = '0x00400FcbF0816bebB94654259de7273f4A05c762'.toLowerCase()
export const mockTestTokenAddress = '0x048F47d358EC521a6cf384461d674750a3cB58C8'.toLowerCase()
export const mockCrealAddress = '0xE4D517785D091D3c54818832dB6094bcc2744545'.toLowerCase()
export const mockWBTCAddress = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'.toLowerCase()
export const mockUSDCAddress = '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8'.toLowerCase()

export const mockCusdTokenId = `celo-alfajores:${mockCusdAddress}`
export const mockCeurTokenId = `celo-alfajores:${mockCeurAddress}`
export const mockCeloTokenId = `celo-alfajores:native`
export const mockPoofTokenId = `celo-alfajores:${mockPoofAddress}`
export const mockTestTokenTokenId = `celo-alfajores:${mockTestTokenAddress}`
export const mockCrealTokenId = `celo-alfajores:${mockCrealAddress}`
export const mockWBTCTokenId = `celo-alfajores:${mockWBTCAddress}`
export const mockEthTokenId = 'ethereum-sepolia:native'
export const mockUSDCTokenId = `ethereum-sepolia:${mockUSDCAddress}`
export const mockARBTokenId = `arbitrum-sepolia:native`
export const mockOPTokenId = `op-sepolia:native`

export const mockQrCodeData2 = {
  address: mockAccount2Invite,
  e164PhoneNumber: mockE164Number2Invite,
  displayName: mockName2Invite,
}

export const mockInviteDetails = {
  timestamp: 1588200517518,
  e164Number: mockE164NumberInvite,
  tempWalletAddress: mockAccount.toLowerCase(),
  tempWalletPrivateKey: '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
  tempWalletRedeemed: false,
  inviteCode: 'ESnrL7zNxmP0kjpklcNbCWJJgStYn3xM0dugHh7a9yQ=',
  inviteLink: 'http://celo.page.link/PARAMS',
}

export const mockInviteDetails2 = {
  timestamp: 1588200517518,
  e164Number: mockE164Number2Invite,
  tempWalletAddress: mockAccountInvite.toLowerCase(),
  tempWalletPrivateKey: mockAccountInvitePrivKey,
  tempWalletRedeemed: false,
  inviteCode: 'sz6sYx/TpBXzc4ZJ24ytV9p4uZ7JLNj3e3a12uLr3yc=',
  inviteLink: 'http://celo.page.link/PARAMS',
}

// using the default mock values
export const mockInviteDetails3 = {
  timestamp: 1588200517518,
  e164Number: mockE164NumberInvite,
  tempWalletAddress: mockAccount2Invite.toLowerCase(),
  tempWalletPrivateKey: mockAccountInvite2PrivKey,
  tempWalletRedeemed: false,
  inviteCode: '5ZwS/rXqE9q8wGiijR1SGibjlGT6p7vMAfQ7g0DpL6Y=',
  inviteLink: 'http://celo.page.link/PARAMS',
}

export const mockInvitableRecipient: ContactRecipient & { displayNumber: string } = {
  name: mockName,
  displayNumber: '14155550000',
  e164PhoneNumber: mockE164Number,
  contactId: 'contactId',
  recipientType: RecipientType.PhoneNumber,
}

export const mockInvitableRecipient2: ContactRecipient = {
  name: mockNameInvite,
  displayNumber: mockDisplayNumberInvite,
  e164PhoneNumber: mockE164NumberInvite,
  contactId: 'contactId',
  recipientType: RecipientType.PhoneNumber,
}

export const mockTransactionData = {
  inputAmount: new BigNumber(1),
  amountIsInLocalCurrency: false,
  tokenAddress: mockCusdAddress,
  recipient: mockInvitableRecipient2,
  tokenAmount: new BigNumber(1),
  tokenId: mockCusdTokenId,
}

export const mockInvitableRecipient3: ContactRecipient = {
  name: mockName2Invite,
  displayNumber: mockDisplayNumber2Invite,
  e164PhoneNumber: mockE164Number2Invite,
  contactId: 'contactId',
  recipientType: RecipientType.PhoneNumber,
}

export const mockTokenTransactionData: TransactionDataInput = {
  recipient: { address: mockAccount, recipientType: RecipientType.Address },
  inputAmount: new BigNumber(1),
  amountIsInLocalCurrency: false,
  tokenAddress: mockCusdAddress,
  tokenId: mockCusdTokenId,
  tokenAmount: new BigNumber(1),
}

export const mockRecipient: ContactRecipient & AddressRecipient & { displayNumber: string } = {
  ...mockInvitableRecipient,
  address: mockAccount,
  recipientType: RecipientType.Address,
}

export const mockRecipient2: ContactRecipient & AddressRecipient = {
  ...mockInvitableRecipient2,
  address: mockAccountInvite,
  recipientType: RecipientType.Address,
}

export const mockRecipient3: ContactRecipient & AddressRecipient = {
  ...mockInvitableRecipient3,
  address: mockAccount2Invite,
  recipientType: RecipientType.Address,
}

export const mockRecipient4: ContactRecipient = {
  name: 'Zebra Zone',
  contactId: 'contactId4',
  e164PhoneNumber: '+14163957395',
  recipientType: RecipientType.PhoneNumber,
}

export const mockPhoneRecipient: AddressRecipient = {
  address: mockAccount2,
  e164PhoneNumber: '+15551234567',
  recipientType: RecipientType.Address,
}

export const mockAddressRecipient: AddressRecipient = {
  address: mockAccount3,
  recipientType: RecipientType.Address,
}

export const mockE164NumberToInvitableRecipient = {
  [mockE164Number]: mockInvitableRecipient,
  [mockE164NumberInvite]: mockInvitableRecipient2,
  [mockE164Number2Invite]: mockInvitableRecipient3,
}

export const mockPhoneRecipientCache: NumberToRecipient = {
  [mockE164Number]: mockRecipient,
  [mockE164NumberInvite]: mockInvitableRecipient2,
  [mockE164Number2Invite]: mockInvitableRecipient3,
}

export const mockValoraRecipientCache: AddressToRecipient = {
  [mockAccount]: mockRecipient,
  [mockAccount2]: mockRecipient2,
  [mockAccountInvite]: mockRecipient2,
  [mockAccount2Invite]: mockRecipient3,
}

export const mockRecipientWithPhoneNumber: MobileRecipient = {
  address: mockAccount,
  name: mockName,
  displayNumber: '14155550000',
  e164PhoneNumber: mockE164Number,
  recipientType: RecipientType.Address,
}

export const mockNavigation: NativeStackNavigationProp<StackParamList, any> = {
  navigate: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
} as unknown as NativeStackNavigationProp<StackParamList, any>

export const mockAddressToE164Number: AddressToE164NumberType = {
  [mockAccount.toLowerCase()]: mockE164Number,
  [mockAccountInvite.toLowerCase()]: mockE164NumberInvite,
  [mockAccount2Invite.toLowerCase()]: mockE164Number2Invite,
}

export const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164Number]: [mockAccount.toLowerCase()],
  [mockE164NumberInvite]: [mockAccountInvite.toLowerCase()],
  [mockE164Number2Invite]: [mockAccount2Invite.toLowerCase()],
}

export const mockContactWithPhone: MinimalContact = {
  recordID: '1',
  displayName: 'Alice The Person',
  phoneNumbers: [
    {
      label: 'mobile',
      number: mockDisplayNumber2,
    },
  ],
  thumbnailPath: '//path/',
}

export const mockContactWithPhone2: MinimalContact = {
  recordID: '2',
  displayName: 'Bob Bobson',
  phoneNumbers: [
    { label: 'home', number: mockE164Number },
    { label: 'mobile', number: '100200' },
  ],
  thumbnailPath: '',
}

export const mockContactList = [mockContactWithPhone2, mockContactWithPhone]

export const mockEscrowedPayment: EscrowedPayment = {
  senderAddress: mockAccount2,
  recipientPhone: mockE164Number,
  recipientIdentifier: mockE164NumberHashWithPepper,
  paymentID: mockAccount,
  tokenAddress: mockCusdAddress,
  amount: new BigNumber(10).toString(),
  timestamp: new BigNumber(10000),
  expirySeconds: new BigNumber(50000),
}

export const mockUriData: UriData[] = [
  {
    address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
    displayName: undefined,
    e164PhoneNumber: undefined,
    currencyCode: 'USD' as LocalCurrencyCode,
    amount: '1',
    comment: undefined,
    token: 'CELO',
  },
  {
    address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
    displayName: undefined,
    e164PhoneNumber: undefined,
    currencyCode: undefined,
    amount: undefined,
    comment: undefined,
    token: 'CELO',
  },
  {
    address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
    displayName: undefined,
    e164PhoneNumber: undefined,
    currencyCode: 'USD' as LocalCurrencyCode,
    amount: '1',
    comment: undefined,
    token: 'BTC',
  },
  {
    address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
    displayName: undefined,
    e164PhoneNumber: undefined,
    currencyCode: 'USD' as LocalCurrencyCode,
    amount: undefined,
    comment: undefined,
    token: undefined,
  },
  {
    address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
    displayName: undefined,
    e164PhoneNumber: undefined,
    currencyCode: 'USD' as LocalCurrencyCode,
    amount: '1',
    comment: undefined,
    token: undefined,
  },
  {
    address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
    displayName: undefined,
    e164PhoneNumber: undefined,
    currencyCode: 'USD' as LocalCurrencyCode,
    amount: '1',
    comment: undefined,
    token: 'cUSD',
  },
]

export const mockQRCodeRecipient: AddressRecipient = {
  address: mockUriData[3].address.toLowerCase(),
  displayNumber: mockUriData[3].e164PhoneNumber,
  name: mockUriData[3].displayName,
  e164PhoneNumber: mockUriData[3].e164PhoneNumber,
  thumbnailPath: undefined,
  contactId: undefined,
  recipientType: RecipientType.Address,
}

export const mockRecipientInfo: RecipientInfo = {
  phoneRecipientCache: mockPhoneRecipientCache,
  valoraRecipientCache: mockValoraRecipientCache,
  addressToE164Number: mockAddressToE164Number,
  addressToDisplayName: {},
}

export const mockWallet: UnlockableWallet = {
  unlockAccount: jest.fn(),
  isAccountUnlocked: jest.fn(),
  addAccount: jest.fn(),
  getAccounts: jest.fn(),
  removeAccount: jest.fn(),
  hasAccount: jest.fn(),
  signTransaction: jest.fn(),
  signTypedData: jest.fn(),
  signPersonalMessage: jest.fn(),
  decrypt: jest.fn(),
  computeSharedSecret: jest.fn(),
}

export const mockTokenBalances: Record<string, StoredTokenBalance> = {
  // NOTE: important to keep 'symbol' fields in this object matching their counterparts from here: https://github.com/valora-inc/address-metadata/blob/main/src/data/mainnet/tokens-info.json ,
  //  particularly for CICO currencies
  [mockPoofTokenId]: {
    priceUsd: '0.1',
    address: mockPoofAddress,
    tokenId: mockPoofTokenId,
    networkId: NetworkId['celo-alfajores'],
    symbol: 'POOF',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_POOF.png',
    name: 'Poof Governance Token',
    decimals: 18,
    balance: '5',
    priceFetchedAt: Date.now(),
  },
  [mockCeurTokenId]: {
    priceUsd: '1.16',
    address: mockCeurAddress,
    tokenId: mockCeurTokenId,
    networkId: NetworkId['celo-alfajores'],
    symbol: 'cEUR',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
    name: 'Celo Euro',
    decimals: 18,
    balance: '0',
    isFeeCurrency: true,
    canTransferWithComment: true,
    priceFetchedAt: Date.now(),
    isCashInEligible: true,
    isCashOutEligible: true,
  },
  [mockCusdTokenId]: {
    priceUsd: '1.001',
    address: mockCusdAddress,
    tokenId: mockCusdTokenId,
    networkId: NetworkId['celo-alfajores'],
    symbol: 'cUSD',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png',
    name: 'Celo Dollar',
    decimals: 18,
    balance: '0',
    isFeeCurrency: true,
    canTransferWithComment: true,
    priceFetchedAt: Date.now(),
    showZeroBalance: true,
    isCashInEligible: true,
    isCashOutEligible: true,
  },
  [mockCeloTokenId]: {
    priceUsd: '13.25085583155252100584',
    address: mockCeloAddress,
    tokenId: mockCeloTokenId,
    networkId: NetworkId['celo-alfajores'],
    symbol: 'CELO', // NOT cGLD, see https://github.com/valora-inc/address-metadata/blob/c84ef7056fa066ef86f9b4eb295ae248f363f67a/src/data/mainnet/tokens-info.json#L173
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
    name: 'Celo native asset',
    decimals: 18,
    balance: '0',
    isFeeCurrency: true,
    canTransferWithComment: true,
    priceFetchedAt: Date.now(),
    showZeroBalance: true,
    isCashInEligible: true,
    isCashOutEligible: true,
    isNative: true,
  },
  [mockCrealTokenId]: {
    priceUsd: '0.17',
    address: mockCrealAddress,
    tokenId: mockCrealTokenId,
    networkId: NetworkId['celo-alfajores'],
    symbol: 'cREAL',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cREAL.png',
    name: 'Celo Real',
    decimals: 18,
    balance: '0',
    isFeeCurrency: true,
    canTransferWithComment: true,
    priceFetchedAt: Date.now(),
    isCashInEligible: true,
  },
  [mockEthTokenId]: {
    priceUsd: '1500',
    address: null,
    tokenId: mockEthTokenId,
    networkId: NetworkId['ethereum-sepolia'],
    symbol: 'ETH',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
    name: 'Ether',
    decimals: 18,
    balance: '0',
    priceFetchedAt: Date.now(),
    isNative: true,
  },
  [mockUSDCTokenId]: {
    name: 'USDC coin',
    networkId: NetworkId['ethereum-sepolia'],
    tokenId: mockUSDCTokenId,
    address: mockUSDCAddress,
    symbol: 'USDC',
    decimals: 6,
    imageUrl: '',
    balance: '0',
    priceUsd: '1',
    priceFetchedAt: Date.now(),
  },
  [mockARBTokenId]: {
    name: 'Ethereum',
    networkId: NetworkId['arbitrum-sepolia'],
    tokenId: mockARBTokenId,
    address: null,
    symbol: 'ETH',
    decimals: 18,
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
    balance: '0',
    priceUsd: '1500',
    isNative: true,
    priceFetchedAt: Date.now(),
  },
  [mockOPTokenId]: {
    name: 'Ethereum',
    networkId: NetworkId['op-sepolia'],
    tokenId: mockOPTokenId,
    address: null,
    symbol: 'ETH',
    decimals: 18,
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
    balance: '0',
    priceUsd: '1500',
    isNative: true,
    priceFetchedAt: Date.now(),
  },
}

export const mockCeloTokenBalance: TokenBalance = {
  ...mockTokenBalances[mockCeloTokenId],
  priceUsd: new BigNumber(0.5),
  lastKnownPriceUsd: new BigNumber(0.4),
  balance: new BigNumber(5),
}

export const mockCusdTokenBalance: TokenBalance = {
  ...mockTokenBalances[mockCusdTokenId],
  priceUsd: new BigNumber(1.001),
  lastKnownPriceUsd: new BigNumber(1.001),
  balance: new BigNumber(0),
}

export const mockEthTokenBalance: NativeTokenBalance = {
  ...mockTokenBalances[mockEthTokenId],
  priceUsd: new BigNumber(1500),
  lastKnownPriceUsd: new BigNumber(1500),
  balance: new BigNumber(0.1),
  isNative: true,
}

export const mockTokenBalancesWithHistoricalPrices = {
  [mockPoofTokenId]: {
    ...mockTokenBalances[mockPoofTokenId],
    historicalPricesUsd: {
      lastDay: {
        price: '0.15',
        at: Date.now() - ONE_DAY_IN_MILLIS,
      },
    },
  },
  [mockCeurTokenId]: {
    ...mockTokenBalances[mockCeurTokenId],
    historicalPricesUsd: {
      lastDay: {
        price: '1.14',
        at: Date.now() - ONE_DAY_IN_MILLIS,
      },
    },
  },
  [mockCusdTokenId]: {
    ...mockTokenBalances[mockCusdTokenId],
    historicalPricesUsd: {
      lastDay: {
        price: '0.99',
        at: Date.now() - ONE_DAY_IN_MILLIS,
      },
    },
  },
}

export const mockContract = {
  methods: {
    approve: jest.fn(),
    transfer: jest.fn(),
    transferWithComment: jest.fn(),
  },
}

export const mockGasPrice = new BigNumber(50000000000)
export const mockFeeInfo = {
  fee: new BigNumber(10000000000000000),
  gas: new BigNumber(20000),
  gasPrice: mockGasPrice,
  feeCurrency: undefined,
}

export const emptyFees = {
  [FeeType.SEND]: undefined,
  [FeeType.EXCHANGE]: undefined,
  [FeeType.RECLAIM_ESCROW]: undefined,
  [FeeType.REGISTER_DEK]: undefined,
}

export const mockSimplexQuote = {
  user_id: mockAccount,
  quote_id: 'be976b14-0828-4834-bd24-e4193a225980',
  wallet_id: 'valorapp',
  digital_money: {
    currency: 'CUSD',
    amount: 25,
  },
  fiat_money: {
    currency: 'USD',
    base_amount: 19,
    total_amount: 25,
  },
  valid_until: '2022-05-09T17:18:28.434Z',
  supported_digital_currencies: ['CUSD', 'CELO'],
}

export const mockProviders: FetchProvidersOutput[] = [
  {
    name: 'Simplex',
    restricted: false,
    unavailable: false,
    paymentMethods: [PaymentMethod.Card],
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: mockSimplexQuote,
  },
  {
    name: 'Moonpay',
    restricted: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'https://www.moonpay.com/',
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: [
      { paymentMethod: PaymentMethod.Bank, digitalAsset: 'cusd', returnedAmount: 95, fiatFee: 5 },
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 90, fiatFee: 10 },
    ],
  },
  {
    name: 'Ramp',
    restricted: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    quote: [
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 100, fiatFee: 0 },
    ],
    cashIn: true,
    cashOut: false,
  },
  {
    name: 'Xanpool',
    restricted: true,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: true,
    quote: [
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 97, fiatFee: 3 },
    ],
  },
  {
    name: 'Transak',
    restricted: false,
    unavailable: true,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: [
      { paymentMethod: PaymentMethod.Bank, digitalAsset: 'cusd', returnedAmount: 94, fiatFee: 6 },
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 88, fiatFee: 12 },
    ],
  },
  {
    name: 'CoinbasePay',
    restricted: false,
    unavailable: false,
    paymentMethods: [PaymentMethod.Coinbase],
    url: undefined,
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2FcbPay-button.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2FcbPay-button.png?alt=media',
    quote: undefined,
    cashIn: true,
    cashOut: false,
  },
  {
    name: 'Ramp',
    restricted: false,
    unavailable: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    quote: [],
    cashIn: false,
    cashOut: true,
  },
  {
    name: 'Fonbnk',
    restricted: false,
    paymentMethods: [PaymentMethod.Airtime],
    url: 'https://www.fakewebsite.com/',
    logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ffonbnk.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ffonbnk.png?alt=media',
    cashIn: true,
    cashOut: false,
    quote: [
      {
        paymentMethod: PaymentMethod.Airtime,
        digitalAsset: 'cusd',
        returnedAmount: 93,
        fiatFee: 7,
        extraReqs: { mobileCarrier: 'MTN' },
      },
    ],
  },
]

export const mockFiatConnectProviderImage =
  'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media'
export const mockFiatConnectProviderIcon =
  'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex-icon.jpg?alt=media'

export const mockFiatConnectProviderInfo: FiatConnectProviderInfo[] = [
  {
    id: 'provider-two',
    providerName: 'Provider Two',
    imageUrl: mockFiatConnectProviderImage,
    baseUrl: 'fakewebsite.valoraapp.com',
    websiteUrl: 'https://fakewebsite.valorapp.com',
    termsAndConditionsUrl: 'https://fakewebsite.valorapp.com/terms',
    privacyPolicyUrl: 'https://fakewebsite.valorapp.com/privacy',
    iconUrl: mockFiatConnectProviderIcon,
    apiKey: 'fake-api-key',
    isNew: {
      in: true,
      out: false,
    },
  },
  {
    id: 'provider-one',
    providerName: 'Provider One',
    imageUrl: mockFiatConnectProviderImage,
    baseUrl: 'fakewebsite.valoraapp.com',
    websiteUrl: 'https://fakewebsite.valorapp.com',
    termsAndConditionsUrl: 'https://fakewebsite.valorapp.com/terms',
    privacyPolicyUrl: 'https://fakewebsite.valorapp.com/privacy',
    iconUrl: mockFiatConnectProviderIcon,
    isNew: {
      in: true,
      out: true,
    },
  },
  {
    id: 'provider-three',
    providerName: 'Provider Three',
    imageUrl: mockFiatConnectProviderImage,
    baseUrl: 'fakewebsite.valoraapp.com',
    websiteUrl: 'https://fakewebsite.valorapp.com',
    termsAndConditionsUrl: 'https://fakewebsite.valorapp.com/terms',
    privacyPolicyUrl: 'https://fakewebsite.valorapp.com/privacy',
    iconUrl: mockFiatConnectProviderIcon,
    isNew: {
      in: false,
      out: false,
    },
  },
]

export const mockGetFiatConnectQuotesResponse: GetFiatConnectQuotesResponse[] = [
  {
    id: 'provider-two',
    ok: true,
    val: {
      quote: {
        fiatType: FiatType.USD,
        cryptoType: CryptoType.cUSD,
        fiatAmount: '100',
        cryptoAmount: '100',
        quoteId: 'mock_quote_in_id',
        guaranteedUntil: '2099-04-27T19:22:36.000Z',
        transferType: TransferType.TransferIn,
        fee: '0.53',
        feeType: QuoteFeeType.PlatformFee,
        feeFrequency: FeeFrequency.OneTime,
      },
      kyc: {
        kycRequired: false,
        kycSchemas: [],
      },
      fiatAccount: {
        BankAccount: {
          fiatAccountSchemas: [
            {
              fiatAccountSchema: FiatAccountSchema.AccountNumber,
              allowedValues: { institutionName: ['Bank A', 'Bank B'] },
            },
          ],
          settlementTimeLowerBound: `300`, // Five minutes
          settlementTimeUpperBound: `7200`, // Two hours
        },
      },
    },
  },
  {
    id: 'provider-one',
    ok: false,
    val: {
      error: FiatConnectError.FiatAmountTooHigh,
      maximumFiatAmount: '100',
    },
  },
]

export const mockFiatConnectQuotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = [
  {
    provider: {
      id: 'provider-one',
      providerName: 'Provider One',
      imageUrl: mockFiatConnectProviderImage,
      baseUrl: 'fakewebsite.valoraapp.com',
      websiteUrl: 'https://fakewebsite.valorapp.com',
      termsAndConditionsUrl: 'https://fakewebsite.valorapp.com/terms',
      privacyPolicyUrl: 'https://fakewebsite.valorapp.com/privacy',
      iconUrl: mockFiatConnectProviderIcon,
      isNew: {
        in: true,
        out: true,
      },
    },
    ok: false,
    error: FiatConnectError.FiatAmountTooHigh,
    maximumFiatAmount: '100',
  },
  {
    provider: mockFiatConnectProviderInfo[0],
    ok: true,
    ...mockGetFiatConnectQuotesResponse[0].val,
  },
  {
    provider: mockFiatConnectProviderInfo[2],
    ok: true,
    quote: {
      fiatType: FiatType.USD,
      cryptoType: CryptoType.cUSD,
      fiatAmount: '100',
      cryptoAmount: '100',
      quoteId: 'mock_quote_in_id',
      guaranteedUntil: '2099-04-27T19:22:36.000Z',
      transferType: TransferType.TransferIn,
      fee: '4.22',
    },
    kyc: {
      kycRequired: true,
      kycSchemas: [{ kycSchema: 'fake-schema' as KycSchema, allowedValues: {} }],
    },
    fiatAccount: {
      BankAccount: {
        fiatAccountSchemas: [
          {
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
            allowedValues: {},
          },
        ],
      },
    },
  },
  {
    provider: mockFiatConnectProviderInfo[2],
    ok: true,
    quote: {
      fiatType: FiatType.USD,
      cryptoType: CryptoType.cUSD,
      fiatAmount: '100',
      cryptoAmount: '100',
      quoteId: 'mock_quote_out_id',
      guaranteedUntil: '2099-04-27T19:22:36.000Z',
      transferType: TransferType.TransferOut,
      fee: '4.22',
    },
    kyc: {
      kycRequired: true,
      kycSchemas: [{ kycSchema: KycSchema.PersonalDataAndDocuments, allowedValues: {} }],
    },
    fiatAccount: {
      BankAccount: {
        fiatAccountSchemas: [
          {
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
            allowedValues: {},
          },
        ],
      },
    },
  },
  {
    provider: mockFiatConnectProviderInfo[2],
    ok: true,
    quote: {
      fiatType: FiatType.USD,
      cryptoType: CryptoType.cUSD,
      fiatAmount: '100',
      cryptoAmount: '100',
      quoteId: 'mock_quote_out_id',
      guaranteedUntil: '2099-04-27T19:22:36.000Z',
      transferType: TransferType.TransferOut,
      fee: '4.22',
    },
    kyc: {
      kycRequired: true,
      kycSchemas: [{ kycSchema: KycSchema.PersonalDataAndDocuments, allowedValues: {} }],
    },
    fiatAccount: {
      MobileMoney: {
        fiatAccountSchemas: [
          {
            fiatAccountSchema: FiatAccountSchema.MobileMoney,
            allowedValues: {},
          },
        ],
      },
    },
  },
]
export const mockFiatConnectQuotesWithUnknownFees: FiatConnectQuoteSuccess[] = [
  {
    // provider-two with no fee given
    provider: mockFiatConnectProviderInfo[0],
    ok: true,
    quote: {
      fiatType: FiatType.USD,
      cryptoType: CryptoType.cUSD,
      fiatAmount: '100',
      cryptoAmount: '100',
      quoteId: 'mock_quote_in_id',
      guaranteedUntil: '2099-04-27T19:22:36.000Z',
      transferType: TransferType.TransferIn,
    },
    kyc: {
      kycRequired: false,
      kycSchemas: [],
    },
    fiatAccount: {
      BankAccount: {
        fiatAccountSchemas: [
          {
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
            allowedValues: { institutionName: ['Bank A', 'Bank B'] },
          },
        ],
        settlementTimeLowerBound: `300`, // Five minutes
        settlementTimeUpperBound: `7200`, // Two hours
      },
    },
  },
  {
    // provider-one with a platform fee
    provider: mockFiatConnectProviderInfo[1],
    ok: true,
    quote: {
      fiatType: FiatType.USD,
      cryptoType: CryptoType.cUSD,
      fiatAmount: '100',
      cryptoAmount: '100',
      quoteId: 'mock_quote_in_id',
      guaranteedUntil: '2099-04-27T19:22:36.000Z',
      transferType: TransferType.TransferIn,
      fee: '0.97',
      feeType: QuoteFeeType.PlatformFee,
      feeFrequency: FeeFrequency.OneTime,
    },
    kyc: {
      kycRequired: false,
      kycSchemas: [],
    },
    fiatAccount: {
      BankAccount: {
        fiatAccountSchemas: [
          {
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
            allowedValues: { institutionName: ['Bank A', 'Bank B'] },
          },
        ],
        settlementTimeLowerBound: `300`, // Five minutes
        settlementTimeUpperBound: `7200`, // Two hours
      },
    },
  },
]

export const mockMaxSendAmount = new BigNumber(999.99995)

export const mockExchanges: ExternalExchangeProvider[] = [
  {
    name: 'Bittrex',
    link: 'https://bittrex.com/Market/Index?MarketName=USD-CELO',
    currencies: [Currency.Celo, Currency.Dollar],
    supportedRegions: ['global'],
  },
  {
    name: 'CoinList Pro',
    link: 'https://coinlist.co/asset/celo',
    currencies: [Currency.Celo, Currency.Dollar],
    supportedRegions: ['global'],
  },
  {
    name: 'OKCoin',
    link: 'https://www.okcoin.com/en/spot/trade/cusd-usd/',
    currencies: [Currency.Celo, Currency.Dollar],
    supportedRegions: ['global'],
  },
]

export const mockOnboardingProps = {
  recoveringFromStoreWipe: true,
  choseToRestoreAccount: false,
  supportedBiometryType: null,
  skipVerification: true,
  numberAlreadyVerifiedCentrally: false,
  chooseAdventureEnabled: false,
  showRecoveryPhrase: false,
  onboardingNameScreenEnabled: true,
  showCloudAccountBackupRestore: false,
}

export const mockDappList: Dapp[] = [
  {
    name: 'Dapp 1',
    id: 'dapp1',
    categories: ['1'],
    description: 'Swap tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/dapp1.png',
    dappUrl: 'https://app.dapp1.org/',
  },
  {
    name: 'Dapp 2',
    id: 'dapp2',
    categories: ['2'],
    description: 'Lend and borrow tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/dapp2.png',
    dappUrl: 'celo://wallet/dapp2Screen',
  },
]

export const mockDappListWithCategoryNames: DappWithCategoryNames[] = [
  {
    name: 'Dapp 1',
    id: 'dapp1',
    categories: ['1'],
    categoryNames: ['Swap'],
    description: 'Swap tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/dapp1.png',
    dappUrl: 'https://app.dapp1.org/',
  },
  {
    name: 'Dapp 2',
    id: 'dapp2',
    categories: ['2'],
    categoryNames: ['Lend, Borrow & Earn'],
    description: 'Lend and borrow tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/dapp2.png',
    dappUrl: 'celo://wallet/dapp2Screen',
  },
  {
    name: 'Dapp 3',
    id: 'dapp3',
    categories: ['1'],
    categoryNames: ['Swap'],
    description: 'Do something cool!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/dapp3.png',
    dappUrl: 'https://app.dapp3.org/',
  },
]

// Generate exchange rates
const endDate = new Date('01/01/2020').getTime()
const celoExchangeRates = range(60).map((i) => ({
  exchangeRate: (i / 60).toString(),
  timestamp: endDate - i * 24 * 3600 * 1000,
}))

export const exchangePriceHistory = {
  aggregatedExchangeRates: celoExchangeRates,
  celoGoldExchangeRates: celoExchangeRates,
  granularity: 60,
  lastTimeUpdated: endDate,
  range: 30 * 24 * 60 * 60 * 1000, // 30 days
}

// Generate mock CELO prices
const prices = range(60).map((i) => ({
  priceUsd: (i / 60).toString(),
  priceFetchedAt: endDate - i * 24 * 3600 * 1000,
}))

export const priceHistory = {
  status: 'success' as PriceHistoryStatus,
  prices,
}

export const mockPositionsLegacy = [
  // positions before hooks API update from 4/2/2024 and wallet redux migration 204
  {
    type: 'app-token',
    network: 'celo',
    address: '0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00',
    appId: 'ubeswap',
    symbol: 'ULP',
    decimals: 18,
    appName: 'Ubeswap',
    displayProps: {
      title: 'MOO / CELO',
      description: 'Pool',
      imageUrl: '',
    },
    tokens: [
      {
        type: 'base-token',
        network: 'celo',
        address: '0x17700282592d6917f6a73d0bf8accf4d578c131e',
        symbol: 'MOO',
        decimals: 18,
        priceUsd: '0.006945061569050171',
        balance: '180.868419020792201216',
      },
      {
        type: 'base-token',
        network: 'celo',
        address: '0x471ece3750da237f93b8e339c536989b8978a438',
        symbol: 'CELO',
        decimals: 18,
        priceUsd: '0.6959536890241361',
        balance: '1.801458498251141632',
      },
    ],
    pricePerShare: ['15.203387577266431', '0.15142650055521278'],
    priceUsd: '0.21097429445966362',
    balance: '11.896586737763895000',
    supply: '29726.018516587721136286',
    availableShortcutIds: [],
  },
  {
    type: 'app-token',
    network: 'celo',
    address: '0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    appId: 'ubeswap',
    symbol: 'ULP',
    decimals: 18,
    appName: 'Ubeswap',
    displayProps: {
      title: 'G$ / cUSD',
      description: 'Pool',
      imageUrl: '',
    },
    tokens: [
      {
        type: 'base-token',
        network: 'celo',
        address: '0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a',
        symbol: 'G$',
        decimals: 18,
        priceUsd: '0.00016235559507324788',
        balance: '12400.197092864986',
      },
      {
        type: 'base-token',
        network: 'celo',
        address: '0x765de816845861e75a25fca122bb6898b8b1282a',
        symbol: 'cUSD',
        decimals: 18,
        priceUsd: '1',
        balance: '2.066998331535406848',
      },
    ],
    pricePerShare: ['77.49807502864574', '0.012918213362397938'],
    priceUsd: '0.025500459450704928',
    balance: '160.006517430032700000',
    supply: '232.413684885485035933',
    availableShortcutIds: [],
  },
  {
    type: 'contract-position',
    network: 'celo',
    address: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
    appId: 'ubeswap',
    appName: 'Ubeswap',
    displayProps: {
      title: 'CELO / cUSD',
      description: 'Farm',
      imageUrl: '',
    },
    tokens: [
      {
        type: 'app-token',
        network: 'celo',
        address: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
        appId: 'ubeswap',
        symbol: 'ULP',
        decimals: 18,
        appName: 'Ubeswap',
        displayProps: {
          title: 'CELO / cUSD',
          description: 'Pool',
          imageUrl: '',
        },
        tokens: [
          {
            type: 'base-token',
            network: 'celo',
            address: '0x471ece3750da237f93b8e339c536989b8978a438',
            symbol: 'CELO',
            decimals: 18,
            priceUsd: '0.6959536890241361',
            balance: '0.950545800159603456', // total USD value = priceUsd * balance = $0.66
            category: 'claimable',
          },
          {
            type: 'base-token',
            network: 'celo',
            address: '0x765de816845861e75a25fca122bb6898b8b1282a',
            symbol: 'cUSD',
            decimals: 18,
            priceUsd: '1',
            balance: '0.659223169268731392',
          },
        ],
        pricePerShare: ['2.827719585853931', '1.961082008754231'],
        priceUsd: '3.9290438860550765',
        balance: '0.336152780111169400',
        supply: '42744.727037884449180591',
        availableShortcutIds: [],
      },
      {
        priceUsd: '0.00904673476946796903',
        type: 'base-token',
        category: 'claimable',
        decimals: 18,
        network: 'celo',
        balance: '0.098322815093446616', // total USD value = priceUsd * balance = $0.00009
        symbol: 'UBE',
        address: '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec',
      },
    ],
    balanceUsd: '1.3207590254762067',
    availableShortcutIds: ['claim-reward'],
  },
]

export const mockPositions: Position[] = [
  {
    type: 'app-token',
    networkId: NetworkId['celo-mainnet'],
    address: '0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00',
    appId: 'ubeswap',
    symbol: 'ULP',
    decimals: 18,
    appName: 'Ubeswap',
    displayProps: {
      title: 'MOO / CELO',
      description: 'Pool',
      imageUrl: '',
    },
    tokens: [
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x17700282592d6917f6a73d0bf8accf4d578c131e',
        symbol: 'MOO',
        decimals: 18,
        priceUsd: '0.006945061569050171',
        balance: '180.868419020792201216',
      },
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x471ece3750da237f93b8e339c536989b8978a438',
        symbol: 'CELO',
        decimals: 18,
        priceUsd: '0.6959536890241361',
        balance: '1.801458498251141632',
      },
    ],
    pricePerShare: ['15.203387577266431', '0.15142650055521278'],
    priceUsd: '0.21097429445966362',
    balance: '11.896586737763895000',
    supply: '29726.018516587721136286',
    availableShortcutIds: [],
  },
  {
    type: 'app-token',
    networkId: NetworkId['celo-mainnet'],
    address: '0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    appId: 'ubeswap',
    symbol: 'ULP',
    decimals: 18,
    appName: 'Ubeswap',
    displayProps: {
      title: 'G$ / cUSD',
      description: 'Pool',
      imageUrl: '',
    },
    tokens: [
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a',
        symbol: 'G$',
        decimals: 18,
        priceUsd: '0.00016235559507324788',
        balance: '12400.197092864986',
      },
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x765de816845861e75a25fca122bb6898b8b1282a',
        symbol: 'cUSD',
        decimals: 18,
        priceUsd: '1',
        balance: '2.066998331535406848',
      },
    ],
    pricePerShare: ['77.49807502864574', '0.012918213362397938'],
    priceUsd: '0.025500459450704928',
    balance: '160.006517430032700000',
    supply: '232.413684885485035933',
    availableShortcutIds: [],
  },
  {
    type: 'contract-position',
    networkId: NetworkId['celo-mainnet'],
    address: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
    appId: 'ubeswap',
    appName: 'Ubeswap',
    displayProps: {
      title: 'CELO / cUSD',
      description: 'Farm',
      imageUrl: '',
    },
    tokens: [
      {
        type: 'app-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
        appId: 'ubeswap',
        symbol: 'ULP',
        decimals: 18,
        appName: 'Ubeswap',
        displayProps: {
          title: 'CELO / cUSD',
          description: 'Pool',
          imageUrl: '',
        },
        tokens: [
          {
            type: 'base-token',
            networkId: NetworkId['celo-mainnet'],
            address: '0x471ece3750da237f93b8e339c536989b8978a438',
            symbol: 'CELO',
            decimals: 18,
            priceUsd: '0.6959536890241361',
            balance: '0.950545800159603456', // total USD value = priceUsd * balance = $0.66
            category: 'claimable',
          },
          {
            type: 'base-token',
            networkId: NetworkId['celo-mainnet'],
            address: '0x765de816845861e75a25fca122bb6898b8b1282a',
            symbol: 'cUSD',
            decimals: 18,
            priceUsd: '1',
            balance: '0.659223169268731392',
          },
        ],
        pricePerShare: ['2.827719585853931', '1.961082008754231'],
        priceUsd: '3.9290438860550765',
        balance: '0.336152780111169400',
        supply: '42744.727037884449180591',
        availableShortcutIds: [],
      },
      {
        priceUsd: '0.00904673476946796903',
        type: 'base-token',
        category: 'claimable',
        decimals: 18,
        networkId: NetworkId['celo-mainnet'],
        balance: '0.098322815093446616', // total USD value = priceUsd * balance = $0.00009
        symbol: 'UBE',
        address: '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec',
      },
    ],
    balanceUsd: '1.3207590254762067',
    availableShortcutIds: ['claim-reward'],
  },
]

export const mockShortcutsLegacy = [
  {
    category: 'claim',
    name: 'Claim',
    networks: ['celo'],
    description: 'Claim rewards for staked liquidity',
    id: 'claim-reward',
    appId: 'ubeswap',
  },
]

export const mockShortcuts: Shortcut[] = [
  {
    category: 'claim',
    name: 'Claim',
    networkIds: [NetworkId['celo-mainnet']],
    description: 'Claim rewards for staked liquidity',
    id: 'claim-reward',
    appId: 'ubeswap',
  },
]

export const mockProviderSelectionAnalyticsData: ProviderSelectionAnalyticsData = {
  centralizedExchangesAvailable: true,
  coinbasePayAvailable: true,
  totalOptions: 3,
  paymentMethodsAvailable: {
    [PaymentMethod.Card]: false,
    [PaymentMethod.Bank]: true,
    [PaymentMethod.Coinbase]: true,
    [PaymentMethod.MobileMoney]: true,
    [PaymentMethod.FiatConnectMobileMoney]: false,
    [PaymentMethod.Airtime]: false,
  },
  transferCryptoAmount: 10.0,
  cryptoType: CiCoCurrency.cUSD,
  lowestFeeKycRequired: false,
  lowestFeeCryptoAmount: 1.0,
  lowestFeeProvider: 'mock-provider-1',
  lowestFeePaymentMethod: PaymentMethod.Bank,
  networkId: NetworkId['celo-mainnet'],
}

export const mockLegacyMobileMoneyProvider: LegacyMobileMoneyProvider = {
  name: 'mock-legacy-mobile-money-1',
  celo: {
    cashIn: false,
    cashOut: false,
    countries: [],
    url: 'fake-url-1',
  },
  cusd: {
    cashIn: true,
    cashOut: true,
    countries: [],
    url: 'fake-url-1',
  },
}

export const mockNftAllFields: NftWithMetadata = {
  contractAddress: mockContractAddress,
  media: [
    {
      gateway: 'https://example.com/gateway/1',
      raw: 'https://example.com/1',
    },
    {
      gateway: 'https://example.com/gateway/2',
      raw: 'https://example.com/2',
    },
  ],
  metadata: {
    attributes: [{ trait_type: 'Fizz Buzz', value: '1' }],
    date: new Date('01/01/2020').getTime(),
    description: 'This is a fizzBuzz name!',
    dna: '000001',
    id: 1,
    image: 'https://example.com/1',
    animation_url: 'https://example.com/2',
    name: `${mockName}.fizzBuzz`,
  },
  ownerAddress: mockAccount,
  tokenId: '1',
  tokenUri: 'https://example.com/1',
  networkId: NetworkId['celo-alfajores'],
}

export const mockNftMinimumFields: Nft = {
  contractAddress: mockContractAddress,
  media: [
    {
      gateway: 'https://example.com/gateway/3',
      raw: 'https://example.com/3',
    },
  ],
  metadata: {
    attributes: [{ trait_type: 'Fizz Buzz', value: 'Fizz' }],
    date: null,
    description: 'This is a fizzBuzz name!',
    dna: null,
    id: null,
    image: 'https://example.com/3',
    name: `${mockName}.fizzBuzz`,
  },
  ownerAddress: mockAccount,
  tokenId: '3',
  tokenUri: 'https://example.com/3',
}

export const mockNftNullMetadata: Nft = {
  contractAddress: mockContractAddress,
  media: [],
  metadata: null,
  tokenId: '4',
}

export const mockTypedData = {
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
}

export const mockApprovalTransaction: TokenApproval = {
  tokenId: 'ethereum-sepolia:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  __typename: 'TokenApproval',
  timestamp: 1695389027000,
  type: TokenTransactionTypeV2.Approval,
  networkId: NetworkId['ethereum-sepolia'],
  block: '18191655',
  approvedAmount: null,
  transactionHash: '0xdad953e4a5dbc282b8e966aeb03a9b2361b60a6ccec4bc97fa0213d8ca67d3ee',
  fees: [
    {
      type: 'SECURITY_FEE',
      amount: {
        tokenId: 'ethereum-sepolia:native',
        value: '0.00103133153065659',
      },
    },
  ],
  status: TransactionStatus.Complete,
}

export const mockExpectedCleverTapInboxMessage = {
  wzrkParams: { wzrk_id: '0_0' },
  id: '1704393845',
  wzrk_id: '0_0',
  msg: {
    tags: [],
    type: 'message-icon',
    content: [
      {
        icon: {
          processing: false,
          poster: '',
          filename: '',
          content_type: 'image/jpeg',
          key: 'fd152d1004504c0ab68a99ce9e3fe5e7',
          url: 'https://d2trgtv8344lrj.cloudfront.net/dist/1634904064/i/fd152d1004504c0ab68a99ce9e3fe5e7.jpeg?v=1704392507',
        },
        title: {
          color: '#434761',
          replacements: 'CleverTap Message Header',
          text: 'CleverTap Message Header',
        },
        action: {
          url: { ios: { replacements: '', text: '' }, android: { replacements: '', text: '' } },
          links: [
            {
              kv: {},
              url: {
                ios: { replacements: 'https://valoraapp.com', text: 'https://valoraapp.com' },
                android: { replacements: 'https://valoraapp.com', text: 'https://valoraapp.com' },
              },
              copyText: { replacements: 'https://valoraapp.com', text: 'https://valoraapp.com' },
              text: 'CleverTap Message CTA',
              bg: '#ffffff',
              color: '#007bff',
              type: 'url',
            },
          ],
          hasLinks: true,
          hasUrl: false,
        },
        message: {
          color: '#434761',
          replacements: 'CleverTap Message Body Text',
          text: 'CleverTap Message Body Text',
        },
        media: {},
        key: 99060129,
      },
    ],
    enableTags: false,
    custom_kv: [],
    orientation: 'p',
    bg: '#ffffff',
  },
  tags: [''],
  isRead: true,
}

export const mockCleverTapInboxMessage: CleverTapInboxMessage = {
  messageId: '1704393845',
  header: 'CleverTap Message Header',
  text: 'CleverTap Message Body Text',
  icon: {
    uri: 'https://d2trgtv8344lrj.cloudfront.net/dist/1634904064/i/fd152d1004504c0ab68a99ce9e3fe5e7.jpeg?v=1704392507',
  },
  ctaText: 'CleverTap Message CTA',
  ctaUrl: 'https://valoraapp.com',
  priority: undefined,
  openInExternalBrowser: false,
}

export const mockStoreCelebrationReady = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.celebrationReadyToDisplay,
    },
  },
}

export const mockStoreRewardReady = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.rewardReadyToDisplay,
      rewardExpirationDate: '3000-12-01T00:00:00.000Z',
      rewardReminderDate: '3000-01-01T00:00:00.000Z',
      deepLink: 'celo://test',
    },
  },
}

export const mockStoreReminderReady = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.reminderReadyToDisplay,
      rewardExpirationDate: '3000-12-01T00:00:00.000Z',
      rewardReminderDate: '3000-01-01T00:00:00.000Z',
      deepLink: 'celo://test',
    },
  },
}

export const mockStoreRewardDisplayed = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.rewardDisplayed,
    },
  },
}

export const mockStoreReminderDisplayed = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.reminderDisplayed,
    },
  },
}

export const mockStoreRewardReayWithDifferentNft = {
  nfts: {
    nfts: [{ ...mockNftAllFields, contractAddress: '0xNFT' }],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.rewardReadyToDisplay,
    },
  },
}

export const mockJumpstartAdddress = '0x7BF3fefE9881127553D23a8Cd225a2c2442c438C'
