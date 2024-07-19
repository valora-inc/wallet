import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import EarnHome from 'src/earn/EarnHome'
import { EarnTabType, Pool } from 'src/earn/types'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockArbArbAddress } from 'test/values'

const pools: Pool[] = [
  {
    poolId: 'aArbUSDCn',
    networkId: NetworkId['arbitrum-one'],
    tokens: [`${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`],
    depositTokenId: `${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`,
    poolTokenId: `${NetworkId['arbitrum-one']}:0x724dc807b04555b71ed48a6896b6f41593b8c637`,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    apy: 0.0555,
    reward: 0,
    tvl: 349_940_000,
    provider: 'Aave',
  },
  {
    poolId: 'aArbWETH',
    networkId: NetworkId['arbitrum-one'],
    tokens: [`${NetworkId['arbitrum-one']}:0x82af49447d8a07e3bd95bd0d56f35241523fbab1`],
    depositTokenId: `${NetworkId['arbitrum-one']}:0x82af49447d8a07e3bd95bd0d56f35241523fbab1`,
    poolTokenId: `${NetworkId['arbitrum-one']}:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8`,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    apy: 0.023,
    reward: 0,
    tvl: 411_630_000,
    provider: 'Aave',
  },
]

describe('EarnHome', () => {
  it('renders correctly', () => {
    const mockPoolToken = {
      name: 'Arbitrum',
      networkId: NetworkId['arbitrum-one'],
      tokenId: pools[0].tokens[0],
      address: mockArbArbAddress,
      symbol: 'ARB',
      decimals: 18,
      imageUrl:
        'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ARB.png',
      balance: '0',
      priceUsd: '1.2',
      priceFetchedAt: Date.now(),
    }
    const { getByTestId, getAllByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              [pools[0].tokens[0]]: mockPoolToken,
            },
          },
        })}
      >
        <MockedNavigator
          component={EarnHome}
          params={{
            activeEarnTab: EarnTabType.OpenPools,
          }}
        />
      </Provider>
    )

    expect(getByTestId(`PoolCard/${pools[0].poolId}`)).toBeTruthy()

    const tabItems = getAllByTestId('Earn/TabBarItem')
    expect(tabItems).toHaveLength(2)
    expect(tabItems[0]).toHaveTextContent('openPools')
    expect(tabItems[1]).toHaveTextContent('myPools')
  })
})
