import { StoredTokenBalances } from 'src/tokens/reducer'

// alfajores addresses
const cUSD = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
const cEUR = '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F'
const CELO = '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9'

export function e2eTokens(): StoredTokenBalances {
  return {
    [cUSD]: {
      address: cUSD,
      decimals: 18,
      imageUrl: '',
      name: 'Celo Dollars',
      symbol: 'cUSD',
      usdPrice: '1',
      balance: null,
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
    [cEUR]: {
      address: cEUR,
      decimals: 18,
      imageUrl: '',
      name: 'Celo Euros',
      symbol: 'cEUR',
      usdPrice: '1.18',
      balance: null,
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
    [CELO]: {
      address: CELO,
      decimals: 18,
      imageUrl: '',
      name: 'Celo native token',
      symbol: 'CELO',
      usdPrice: '6.5',
      balance: null,
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
  }
}
