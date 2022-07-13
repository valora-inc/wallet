import { balanceInfoForSuperchargeSelector } from 'src/consumerIncentives/selectors'
import { getMockStoreData } from 'test/utils'

describe('balanceInfoForSuperchargeSelector', () => {
  it('should return the info for the token with the highest USD balance among the possible supercharge tokens for which the minimum token balance is met', () => {
    const state = getMockStoreData({
      app: {
        superchargeTokens: [
          {
            tokenSymbol: 'cUSD',
            minBalance: 10,
            maxBalance: 1000,
          },
          {
            tokenSymbol: 'cEUR',
            minBalance: 10,
            maxBalance: 1000,
          },
          {
            tokenSymbol: 'A',
            minBalance: 10,
            maxBalance: 1000,
          },
        ],
      },
      tokens: {
        tokenBalances: {
          '0xcusd': {
            name: 'Celo Dollars',
            address: '0xcusd',
            symbol: 'cUSD',
            decimals: 18,
            imageUrl: '',
            usdPrice: '1',
            balance: '10',
            priceFetchedAt: Date.now(),
            isCoreToken: true,
          },
          '0xceur': {
            name: 'Celo Euros',
            address: '0xceur',
            symbol: 'cEUR',
            decimals: 18,
            imageUrl: '',
            usdPrice: '1.2',
            balance: '20',
            priceFetchedAt: Date.now(),
            isCoreToken: true,
            isSupercharged: true,
          },
          '0xcelo': {
            name: 'Celo',
            address: '0xcelo',
            symbol: 'CELO',
            decimals: 18,
            imageUrl: '',
            usdPrice: '5',
            balance: '5',
            priceFetchedAt: Date.now(),
            isCoreToken: true,
          },
          // This is the expected supercharge token which has the max usd balance
          '0xa': {
            name: 'a',
            address: '0xa',
            symbol: 'A',
            decimals: 18,
            imageUrl: '',
            usdPrice: '5',
            balance: '10',
            priceFetchedAt: Date.now(),
            isSupercharged: true,
          },
        },
      },
    })

    expect(balanceInfoForSuperchargeSelector(state)).toStrictEqual({
      hasBalanceForSupercharge: true,
      superchargingTokenConfig: {
        tokenSymbol: 'A',
        minBalance: 10,
        maxBalance: 1000,
      },
      hasMaxBalance: false,
    })
  })
})
