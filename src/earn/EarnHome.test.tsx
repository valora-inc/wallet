import { fireEvent, render } from '@testing-library/react-native'
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

  it('correctly shows pool under my pools if has balance', () => {
    const mockPoolToken = {
      name: 'Arbitrum',
      networkId: NetworkId['arbitrum-one'],
      tokenId: pools[0].poolTokenId,
      address: mockArbArbAddress,
      symbol: 'ARB',
      decimals: 18,
      imageUrl:
        'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ARB.png',
      balance: '10',
      priceUsd: '1.2',
      priceFetchedAt: Date.now(),
    }
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              [pools[0].poolTokenId]: mockPoolToken,
              [`${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`]: {
                name: 'USDC',
                networkId: NetworkId['arbitrum-one'],
                tokenId: `${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`,
                address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                symbol: 'USDC',
                decimals: 18,
                imageUrl:
                  'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/USDC.png',
                balance: '1',
                priceUsd: '1',
                priceFetchedAt: Date.now(),
              },
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

    expect(queryByTestId(`PoolCard/${pools[0].poolId}`)).toBeFalsy()
    fireEvent.press(getByText('earnFlow.poolFilters.myPools'))
    expect(getByTestId(`PoolCard/${pools[0].poolId}`)).toBeTruthy()
  })

  it('correctly shows correct networks, tokens under filters', () => {
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
    const { getByTestId, getAllByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              [pools[0].tokens[0]]: mockPoolToken,
              [`${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`]: {
                name: 'USDC',
                networkId: NetworkId['arbitrum-one'],
                tokenId: `${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`,
                address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                symbol: 'USDC',
                decimals: 18,
                imageUrl:
                  'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/USDC.png',
                balance: '0',
                priceUsd: '1',
                priceFetchedAt: Date.now(),
              },
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

    fireEvent.press(getByText('tokenBottomSheet.filters.selectNetwork'))
    expect(getByTestId('Arbitrum One-icon')).toBeTruthy()

    fireEvent.press(getByText('tokenBottomSheet.filters.tokens'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(1)
  })
})
