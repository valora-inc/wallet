import { mockAccount } from 'test/values'
import { FetchProvidersOutput, getQuotes, PaymentMethod } from './utils'

const MOCK_SIMPLEX_QUOTE = {
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
    total_amount: 6,
  },
  valid_until: '2022-05-09T17:18:28.434Z',
  supported_digital_currencies: ['CUSD', 'CELO'],
}

const mockProviders: FetchProvidersOutput[] = [
  {
    name: 'Simplex',
    restricted: false,
    unavailable: false,
    paymentMethods: [PaymentMethod.Card],
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: MOCK_SIMPLEX_QUOTE,
  },
  {
    name: 'Moonpay',
    restricted: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'https://www.moonpay.com/',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
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
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
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
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
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
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: [
      { paymentMethod: PaymentMethod.Bank, digitalAsset: 'cusd', returnedAmount: 94, fiatFee: 6 },
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 88, fiatFee: 12 },
    ],
  },
]

describe(getQuotes, () => {
  it('transforms providers to quotes', () => {
    const quotes = getQuotes(mockProviders)

    // Filters out unavailable / restricted
    expect(quotes.find((quote) => quote.provider.name === 'Transak')).toBeUndefined()
    expect(quotes.find((quote) => quote.provider.name === 'Xanpool')).toBeUndefined()

    // Handles a simplex quote
    expect(quotes.find((quote) => quote.provider.name === 'Simplex')).toEqual({
      provider: {
        logo:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
        logoWide:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
        name: 'Simplex',
      },
      quote: {
        cashIn: true,
        cashOut: false,
        digital_money: {
          amount: 25,
          currency: 'CUSD',
        },
        fiat_money: {
          base_amount: 19,
          currency: 'USD',
          total_amount: 6,
        },
        paymentMethod: 'Card',
        quote_id: 'be976b14-0828-4834-bd24-e4193a225980',
        supported_digital_currencies: ['CUSD', 'CELO'],
        user_id: '0x0000000000000000000000000000000000007E57',
        valid_until: '2022-05-09T17:18:28.434Z',
        wallet_id: 'valorapp',
      },
    })

    // Handles a provider with multiple quotes
    expect(quotes.filter((quote) => quote.provider.name === 'Moonpay').length).toEqual(2)
  })
})
