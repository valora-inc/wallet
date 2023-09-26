import { superchargeInfoSelector } from 'src/consumerIncentives/selectors'
import { getMockStoreData } from 'test/utils'
import { NetworkId } from 'src/transactions/types'

const DEFAULT_SUPERCHARGE_CONFIG = {
  minBalance: 10,
  maxBalance: 1000,
}

const DEFAULT_TOKEN_BALANCE_INFO = {
  name: 'Test token',
  networkId: NetworkId['celo-alfajores'],
  decimals: 18,
  imageUrl: '',
  priceFetchedAt: Date.now(),
}

describe('balanceInfoForSuperchargeSelector', () => {
  it('should return the info for the token with the highest superchargeable USD balance not only considering the balance', () => {
    const state = getMockStoreData({
      app: {
        superchargeTokenConfigByToken: {
          '0xa': DEFAULT_SUPERCHARGE_CONFIG,
          '0xb': DEFAULT_SUPERCHARGE_CONFIG,
          '0xc': DEFAULT_SUPERCHARGE_CONFIG,
          '0xd': DEFAULT_SUPERCHARGE_CONFIG,
        },
      },
      tokens: {
        tokenBalances: {
          'celo-alfajores:0xa': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            address: '0xa',
            tokenId: 'celo-alfajores:0xa',
            symbol: 'A',
            balance: '2000',
            usdPrice: '1',
          },
          'celo-alfajores:0xb': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            address: '0xb',
            tokenId: 'celo-alfajores:0xb',
            symbol: 'B',
            balance: '800',
            usdPrice: '2',
          },
          'celo-alfajores:0xc': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            address: '0xc',
            tokenId: 'celo-alfajores:0xc',
            symbol: 'C',
            balance: '1000',
            usdPrice: '1',
          },
          'celo-alfajores:0xd': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            address: '0xd',
            tokenId: 'celo-alfajores:0xd',
            symbol: 'D',
            balance: '500',
            usdPrice: '5',
          },
        },
      },
    })

    expect(superchargeInfoSelector(state)).toStrictEqual({
      hasBalanceForSupercharge: true,
      superchargingTokenConfig: {
        tokenSymbol: 'D',
        minBalance: 10,
        maxBalance: 1000,
      },
      hasMaxBalance: false,
      superchargeBalance: 500,
      superchargeUsdBalance: 2500,
    })
  })

  it('should return the info for the token with the highest superchargeable USD balance with enough balance', () => {
    const state = getMockStoreData({
      app: {
        superchargeTokenConfigByToken: {
          '0xa': DEFAULT_SUPERCHARGE_CONFIG,
          '0xb': DEFAULT_SUPERCHARGE_CONFIG,
          '0xc': DEFAULT_SUPERCHARGE_CONFIG,
        },
      },
      tokens: {
        tokenBalances: {
          'celo-alfajores:0xa': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            tokenId: 'celo-alfajores:0xa',
            address: '0xa',
            symbol: 'A',
            balance: '8',
            usdPrice: '20',
          },
          'celo-alfajores:0xb': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            tokenId: 'celo-alfajores:0xb',
            address: '0xb',
            symbol: 'B',
            balance: '20',
            usdPrice: '2',
          },
          'celo-alfajores:0xc': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            tokenId: 'celo-alfajores:0xc',
            address: '0xc',
            symbol: 'C',
            balance: '30',
            usdPrice: '1',
          },
        },
      },
    })

    expect(superchargeInfoSelector(state)).toStrictEqual({
      hasBalanceForSupercharge: true,
      superchargingTokenConfig: {
        tokenSymbol: 'B',
        minBalance: 10,
        maxBalance: 1000,
      },
      hasMaxBalance: false,
      superchargeBalance: 20,
      superchargeUsdBalance: 40,
    })
  })

  it('should return has max balance when balance is greater than the maxBalance', () => {
    const state = getMockStoreData({
      app: {
        superchargeTokenConfigByToken: {
          '0xa': DEFAULT_SUPERCHARGE_CONFIG,
          '0xb': DEFAULT_SUPERCHARGE_CONFIG,
          '0xc': DEFAULT_SUPERCHARGE_CONFIG,
        },
      },
      tokens: {
        tokenBalances: {
          'celo-alfajores:0xa': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            tokenId: 'celo-alfajores:0xa',
            address: '0xa',
            symbol: 'A',
            balance: '1200',
            usdPrice: '2',
          },
          'celo-alfajores:0xb': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            tokenId: 'celo-alfajores:0xb',
            address: '0xb',
            symbol: 'B',
            balance: '3000',
            usdPrice: '1',
          },
          'celo-alfajores:0xc': {
            ...DEFAULT_TOKEN_BALANCE_INFO,
            tokenId: 'celo-alfajores:0xc',
            address: '0xc',
            symbol: 'C',
            balance: '900',
            usdPrice: '1',
          },
        },
      },
    })

    expect(superchargeInfoSelector(state)).toStrictEqual({
      hasBalanceForSupercharge: true,
      superchargingTokenConfig: {
        tokenSymbol: 'A',
        minBalance: 10,
        maxBalance: 1000,
      },
      hasMaxBalance: true,
      superchargeBalance: 1000,
      superchargeUsdBalance: 2000,
    })
  })
})
