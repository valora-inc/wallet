import { mockProviders } from 'test/values'
import { getQuotes } from './utils'

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
