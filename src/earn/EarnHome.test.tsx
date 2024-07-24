import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import EarnHome from 'src/earn/EarnHome'
import { getPools } from 'src/earn/pools'
import { EarnTabType, Pool } from 'src/earn/types'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEthTokenId,
  mockTokenBalances,
} from 'test/values'

const mockPools: Pool[] = [
  {
    poolId: 'aArbUSDCn',
    networkId: NetworkId['arbitrum-sepolia'],
    tokens: [mockArbUsdcTokenId],
    depositTokenId: mockArbUsdcTokenId,
    poolTokenId: `${NetworkId['arbitrum-sepolia']}:0x724dc807b04555b71ed48a6896b6f41593b8c637`,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    apy: 0.0555,
    reward: 0,
    tvl: 349_940_000,
    provider: 'Aave',
  },
]

  {
    poolId: 'aArbWETH',
    networkId: NetworkId['arbitrum-sepolia'],
    tokens: [mockArbEthTokenId],
    depositTokenId: mockArbEthTokenId,
    poolTokenId: `${NetworkId['arbitrum-sepolia']}:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8`,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    apy: 0.023,
    reward: 0,
    tvl: 411_630_000,
    provider: 'Aave',
  },
]

const mockPoolTokenUSDC = {
  name: 'Aave Arbitrum USDC',
  networkId: NetworkId['arbitrum-sepolia'],
  tokenId: mockPools[0].poolTokenId,
  address: '0x724dc807b04555b71ed48a6896b6f41593b8c637',
  symbol: 'aArbUSDCn',
  decimals: 18,
  imageUrl:
    'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ARB.png',
  balance: '0',
  priceUsd: '1.2',
  priceFetchedAt: Date.now(),
}

const mockPoolTokenWETH = {
  name: 'Aave Arbitrum WETH',
  networkId: NetworkId['arbitrum-sepolia'],
  tokenId: mockPools[1].poolTokenId,
  address: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
  symbol: 'aArbWETH',
  decimals: 18,
  imageUrl:
    'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
  balance: '0',
  priceUsd: '250',
  priceFetchedAt: Date.now(),
}

const mockPoolTokenEthWETH = {
  name: 'Aave Ethereum WETH',
  networkId: NetworkId['ethereum-sepolia'],
  tokenId: `${NetworkId['ethereum-sepolia']}:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8`,
  address: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
  symbol: 'aEthWETH',
  decimals: 18,
  imageUrl:
    'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
  balance: '0',
  priceUsd: '250',
  priceFetchedAt: Date.now(),
}

jest.mock('src/earn/pools')

describe('EarnHome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders open pools correctly', () => {
    jest.mocked(getPools).mockReturnValue(mockPools)
    const mockPoolToken = mockPoolTokenUSDC
    const { getByTestId, getAllByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockPools[0].poolTokenId]: mockPoolToken,
              [mockPools[1].poolTokenId]: mockPoolTokenWETH,
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

    expect(getByTestId(`PoolCard/${mockPools[0].poolId}`)).toBeTruthy()
    expect(getByTestId(`PoolCard/${mockPools[1].poolId}`)).toBeTruthy()

    const tabItems = getAllByTestId('Earn/TabBarItem')
    expect(tabItems).toHaveLength(2)
    expect(tabItems[0]).toHaveTextContent('openPools')
    expect(tabItems[1]).toHaveTextContent('myPools')
  })

  it('correctly shows pool under my pools if has balance', () => {
    jest.mocked(getPools).mockReturnValue(mockPools)
    const mockPoolToken = {
      ...mockPoolTokenUSDC,
      balance: '10',
    }
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockPools[0].poolTokenId]: mockPoolToken,
              [mockPools[1].poolTokenId]: mockPoolTokenWETH,
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

    expect(queryByTestId(`PoolCard/${mockPools[0].poolId}`)).toBeFalsy()
    fireEvent.press(getByText('earnFlow.poolFilters.myPools'))
    expect(getByTestId(`PoolCard/${mockPools[0].poolId}`)).toBeTruthy()
  })

  it('correctly shows correct networks, tokens under filters', () => {
    jest.mocked(getPools).mockReturnValue(mockPools)
    const mockPoolToken = mockPoolTokenUSDC
    const { getByTestId, getAllByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockPools[0].poolTokenId]: mockPoolToken,
              [mockPools[1].poolTokenId]: mockPoolTokenWETH,
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
    expect(getByTestId('Arbitrum Sepolia-icon')).toBeTruthy()

    fireEvent.press(getByText('tokenBottomSheet.filters.tokens'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
  })

  it('shows correct pool when filtering by token', () => {
    jest.mocked(getPools).mockReturnValue(mockPools)
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockPools[0].poolTokenId]: mockPoolTokenUSDC,
              [mockPools[1].poolTokenId]: mockPoolTokenWETH,
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

    expect(getByTestId(`PoolCard/${mockPools[0].poolId}`)).toBeTruthy()
    expect(getByTestId(`PoolCard/${mockPools[1].poolId}`)).toBeTruthy()

    fireEvent.press(getByText('tokenBottomSheet.filters.tokens'))
    fireEvent.press(getByTestId('USDCSymbol'))

    expect(getByTestId(`PoolCard/${mockPools[0].poolId}`)).toBeTruthy()
    expect(queryByTestId(`PoolCard/${mockPools[1].poolId}`)).toBeFalsy()
  })

  it('shows correct pool when filtering by network', () => {
    const mockPoolsForNetworkFilter: Pool[] = [
      mockPools[0],
      {
        poolId: 'aEthWETH',
        networkId: NetworkId['ethereum-sepolia'],
        tokens: [mockEthTokenId],
        depositTokenId: mockEthTokenId,
        poolTokenId: `${NetworkId['ethereum-sepolia']}:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8`,
        poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        apy: 0.023,
        reward: 0,
        tvl: 411_630_000,
        provider: 'Aave',
      },
    ]
    jest.mocked(getPools).mockReturnValue(mockPoolsForNetworkFilter)
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockPoolsForNetworkFilter[0].poolTokenId]: mockPoolTokenUSDC,
              [mockPoolsForNetworkFilter[1].poolTokenId]: mockPoolTokenEthWETH,
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

    expect(getByTestId(`PoolCard/${mockPoolsForNetworkFilter[0].poolId}`)).toBeTruthy()
    expect(getByTestId(`PoolCard/${mockPoolsForNetworkFilter[1].poolId}`)).toBeTruthy()

    fireEvent.press(getByText('tokenBottomSheet.filters.selectNetwork'))
    fireEvent.press(getByTestId('Arbitrum Sepolia-icon'))

    expect(getByTestId(`PoolCard/${mockPoolsForNetworkFilter[0].poolId}`)).toBeTruthy()
    expect(queryByTestId(`PoolCard/${mockPoolsForNetworkFilter[1].poolId}`)).toBeFalsy()
  })
})
