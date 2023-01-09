/* Shared mock values to facilitate testing */
import { UnlockableWallet } from '@celo/wallet-base'
import {
  CryptoType,
  FeeFrequency,
  FeeType as QuoteFeeType,
  FiatAccountSchema,
  FiatConnectError,
  FiatType,
  KycSchema,
  TransferType,
} from '@fiatconnect/fiatconnect-types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { MinimalContact } from 'react-native-contacts'
import { TokenTransactionType } from 'src/apollo/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeRates } from 'src/exchange/reducer'
import { FeeType } from 'src/fees/reducer'
import {
  FiatConnectProviderInfo,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
  GetFiatConnectQuotesResponse,
} from 'src/fiatconnect'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { FetchProvidersOutput, PaymentMethod } from 'src/fiatExchanges/utils'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { StackParamList } from 'src/navigator/types'
import { NotificationTypes } from 'src/notifications/types'
import { PaymentRequest, PaymentRequestStatus } from 'src/paymentRequest/types'
import { UriData } from 'src/qrcode/schema'
import {
  AddressRecipient,
  AddressToRecipient,
  ContactRecipient,
  MobileRecipient,
  NumberToRecipient,
  RecipientInfo,
} from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { StoredTokenBalance } from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

export const nullAddress = '0x0'

export const mockName = 'John Doe'
export const mockAccount = '0x0000000000000000000000000000000000007E57'
export const mockAccount2 = '0x1Ff482D42D8727258A1686102Fa4ba925C46Bc42'
export const mockAccount3 = '0x1230000000000000000000000000000000007E57'

export const mockMnemonic =
  'prosper winner find donate tape history measure umbrella agent patrol want rhythm old unable wash wrong need fluid hammer coach reveal plastic trust lake'

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

export const mockInvitableRecipient: ContactRecipient = {
  name: mockName,
  displayNumber: '14155550000',
  e164PhoneNumber: mockE164Number,
  contactId: 'contactId',
}

export const mockInvitableRecipient2: ContactRecipient = {
  name: mockNameInvite,
  displayNumber: mockDisplayNumberInvite,
  e164PhoneNumber: mockE164NumberInvite,
  contactId: 'contactId',
}

export const mockTransactionData = {
  inputAmount: new BigNumber(1),
  amountIsInLocalCurrency: false,
  tokenAddress: mockCusdAddress,
  recipient: mockInvitableRecipient2,
  tokenAmount: new BigNumber(1),
}

export const mockTransactionDataLegacy = {
  recipient: mockInvitableRecipient2,
  amount: new BigNumber(1),
  currency: Currency.Dollar,
  type: TokenTransactionType.Sent,
}

export const mockInviteTransactionData = {
  recipient: mockInvitableRecipient2,
  amount: new BigNumber(1),
  currency: Currency.Dollar,
  type: TokenTransactionType.InviteSent,
}

export const mockInvitableRecipient3: ContactRecipient = {
  name: mockName2Invite,
  displayNumber: mockDisplayNumber2Invite,
  e164PhoneNumber: mockE164Number2Invite,
  contactId: 'contactId',
}

export const mockTokenTransactionData: TransactionDataInput = {
  recipient: { address: mockAccount },
  inputAmount: new BigNumber(1),
  amountIsInLocalCurrency: false,
  tokenAddress: mockCusdAddress,
  tokenAmount: new BigNumber(1),
}

export const mockTokenInviteTransactionData: TransactionDataInput = {
  recipient: mockInvitableRecipient,
  inputAmount: new BigNumber(1),
  amountIsInLocalCurrency: false,
  tokenAddress: mockCusdAddress,
  tokenAmount: new BigNumber(1),
}

export const mockRecipient: ContactRecipient & AddressRecipient = {
  ...mockInvitableRecipient,
  address: mockAccount,
}

export const mockRecipient2: ContactRecipient & AddressRecipient = {
  ...mockInvitableRecipient2,
  address: mockAccountInvite,
}

export const mockRecipient3: ContactRecipient & AddressRecipient = {
  ...mockInvitableRecipient3,
  address: mockAccount2Invite,
}

export const mockRecipient4: ContactRecipient = {
  name: 'Zebra Zone',
  contactId: 'contactId4',
  e164PhoneNumber: '+14163957395',
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
  [mockAccountInvite]: mockRecipient2,
  [mockAccount2Invite]: mockRecipient3,
}

export const mockRecipientWithPhoneNumber: MobileRecipient = {
  address: mockAccount,
  name: mockName,
  displayNumber: '14155550000',
  e164PhoneNumber: mockE164Number,
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
  [mockAccount]: mockE164Number,
  [mockAccountInvite]: mockE164NumberInvite,
  [mockAccount2Invite]: mockE164Number2Invite,
}

export const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164Number]: [mockAccount],
  [mockE164NumberInvite]: [mockAccountInvite],
  [mockE164Number2Invite]: [mockAccount2Invite],
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

const date = new Date('Tue Mar 05 2019 13:44:06 GMT-0800 (Pacific Standard Time)').getTime()
export const mockPaymentRequests: PaymentRequest[] = [
  {
    amount: '200000.00',
    uid: 'FAKE_ID_1',
    createdAt: date,
    comment: 'Dinner for me and the gals, PIZZAA!',
    requesteeAddress: mockAccount,
    requesterAddress: mockAccount2,
    requesterE164Number: mockE164Number,
    status: PaymentRequestStatus.REQUESTED,
    notified: true,
    type: NotificationTypes.PAYMENT_REQUESTED,
  },
  {
    createdAt: date,
    amount: '180.89',
    uid: 'FAKE_ID_2',
    comment: 'My Birthday Present. :) Am I not the best? Celebration. Bam!',
    requesteeAddress: mockAccount,
    requesterAddress: mockAccount2,
    requesterE164Number: mockE164Number,
    status: PaymentRequestStatus.REQUESTED,
    notified: true,
    type: NotificationTypes.PAYMENT_REQUESTED,
  },
  {
    createdAt: date,
    amount: '180.89',
    uid: 'FAKE_ID_3',
    comment: 'My Birthday Present. :) Am I not the best? Celebration. Bam!',
    requesteeAddress: mockAccount,
    requesterAddress: mockAccount2,
    requesterE164Number: mockE164Number,
    status: PaymentRequestStatus.REQUESTED,
    notified: true,
    type: NotificationTypes.PAYMENT_REQUESTED,
  },
]

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

export const makeExchangeRates = (
  celoToDollarExchangeRate: string,
  dollarToCeloExchangeRate: string
): ExchangeRates => ({
  [Currency.Celo]: {
    [Currency.Dollar]: celoToDollarExchangeRate,
    [Currency.Euro]: '',
    [Currency.Celo]: '',
  },
  [Currency.Dollar]: {
    [Currency.Celo]: dollarToCeloExchangeRate,
    [Currency.Euro]: '',
    [Currency.Dollar]: '',
  },
  [Currency.Euro]: {
    [Currency.Celo]: '',
    [Currency.Euro]: '',
    [Currency.Dollar]: '',
  },
})

export const mockTokenBalances: Record<string, StoredTokenBalance> = {
  // NOTE: important to keep 'symbol' fields in this object matching their counterparts from here: https://github.com/valora-inc/address-metadata/blob/main/src/data/mainnet/tokens-info.json ,
  //  particularly for CICO currencies
  [mockPoofAddress]: {
    usdPrice: '0.1',
    address: mockPoofAddress,
    symbol: 'POOF',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_POOF.png',
    name: 'Poof Governance Token',
    decimals: 18,
    balance: '5',
    priceFetchedAt: Date.now(),
  },
  [mockCeurAddress]: {
    usdPrice: '1.16',
    address: mockCeurAddress,
    symbol: 'cEUR',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
    name: 'Celo Euro',
    decimals: 18,
    balance: '0',
    isCoreToken: true,
    priceFetchedAt: Date.now(),
  },
  [mockCusdAddress]: {
    usdPrice: '1.001',
    address: mockCusdAddress,
    symbol: 'cUSD',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png',
    name: 'Celo Dollar',
    decimals: 18,
    balance: '0',
    isCoreToken: true,
    priceFetchedAt: Date.now(),
  },
  [mockCeloAddress]: {
    usdPrice: '13.25085583155252100584',
    address: mockCeloAddress,
    symbol: 'CELO', // NOT cGLD, see https://github.com/valora-inc/address-metadata/blob/c84ef7056fa066ef86f9b4eb295ae248f363f67a/src/data/mainnet/tokens-info.json#L173
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
    name: 'Celo native asset',
    decimals: 18,
    balance: '0',
    isCoreToken: true,
    priceFetchedAt: Date.now(),
  },
  [mockCrealAddress]: {
    usdPrice: '0.17',
    address: mockCrealAddress,
    symbol: 'cREAL',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cREAL.png',
    name: 'Celo Real',
    decimals: 18,
    balance: '0',
    isCoreToken: true,
    priceFetchedAt: Date.now(),
  },
}

export const mockTokenBalancesWithHistoricalPrices = {
  [mockPoofAddress]: {
    ...mockTokenBalances[mockPoofAddress],
    historicalUsdPrices: {
      lastDay: {
        price: '0.15',
        at: Date.now() - ONE_DAY_IN_MILLIS,
      },
    },
  },
  '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
    ...mockTokenBalances['0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F'],
    historicalUsdPrices: {
      lastDay: {
        price: '1.14',
        at: Date.now() - ONE_DAY_IN_MILLIS,
      },
    },
  },
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1': {
    ...mockTokenBalances['0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'],
    historicalUsdPrices: {
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
