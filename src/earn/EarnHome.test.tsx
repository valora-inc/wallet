import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import EarnHome from 'src/earn/EarnHome'
import { EarnTabType } from 'src/earn/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockEarnPositions, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

function getStore(mockPoolBalance: string = '0') {
  return createMockStore({
    tokens: {
      tokenBalances: {
        ...mockTokenBalances,
      },
    },
    positions: {
      positions: [
        {
          ...mockEarnPositions[0],
          balance: mockPoolBalance,
        },
        mockEarnPositions[1],
      ],
      earnPositionIds: mockEarnPositions.map((position) => position.positionId),
    },
  })
}

describe('EarnHome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS
      )
  })
  it('shows the zero state UI under my pools if the user has no pools with balance', () => {
    const { getByText } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={EarnHome}
          params={{
            activeEarnTab: EarnTabType.MyPools,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.home.noPoolsTitle')).toBeTruthy()
  })
  it('renders all pools correctly', () => {
    const { getByTestId, queryAllByTestId } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={EarnHome}
          params={{
            activeEarnTab: EarnTabType.AllPools,
          }}
        />
      </Provider>
    )

    expect(
      getByTestId('PoolCard/arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216')
    ).toBeTruthy()
    expect(
      getByTestId('PoolCard/ethereum-sepolia:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8')
    ).toBeTruthy()

    const tabItems = queryAllByTestId('Earn/TabBarItem')
    expect(tabItems).toHaveLength(2)
    expect(tabItems[0]).toHaveTextContent('earnFlow.poolFilters.allPools')
    expect(tabItems[1]).toHaveTextContent('earnFlow.poolFilters.myPools')
  })

  it('correctly shows pool under my pools if has balance', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider store={getStore('10')}>
        <MockedNavigator
          component={EarnHome}
          params={{
            activeEarnTab: EarnTabType.AllPools,
          }}
        />
      </Provider>
    )

    // All Pools
    expect(
      queryByTestId('PoolCard/arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216')
    ).toBeTruthy()
    expect(
      getByTestId('PoolCard/ethereum-sepolia:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8')
    ).toBeTruthy()
    fireEvent.press(getByText('earnFlow.poolFilters.myPools'))
    // My Pools
    expect(
      getByTestId('PoolCard/arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216')
    ).toBeTruthy()
    expect(
      queryByTestId('PoolCard/ethereum-sepolia:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8')
    ).toBeFalsy()
  })

  it('correctly shows correct networks, tokens under filters', () => {
    const { getByTestId, getAllByTestId, getByText } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={EarnHome}
          params={{
            activeEarnTab: EarnTabType.AllPools,
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
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={EarnHome}
          params={{
            activeEarnTab: EarnTabType.AllPools,
          }}
        />
      </Provider>
    )

    expect(
      getByTestId('PoolCard/arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216')
    ).toBeTruthy()
    expect(
      getByTestId('PoolCard/ethereum-sepolia:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8')
    ).toBeTruthy()

    fireEvent.press(getByText('tokenBottomSheet.filters.tokens'))
    fireEvent.press(getByTestId('USDCSymbol'))

    expect(
      getByTestId('PoolCard/arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216')
    ).toBeTruthy()
    expect(
      queryByTestId('PoolCard/ethereum-sepolia:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8')
    ).toBeFalsy()
  })

  it('shows correct pool when filtering by network', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={EarnHome}
          params={{
            activeEarnTab: EarnTabType.AllPools,
          }}
        />
      </Provider>
    )

    expect(
      getByTestId('PoolCard/arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216')
    ).toBeTruthy()
    expect(
      getByTestId('PoolCard/ethereum-sepolia:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8')
    ).toBeTruthy()

    fireEvent.press(getByText('tokenBottomSheet.filters.selectNetwork'))
    fireEvent.press(getByTestId('Arbitrum Sepolia-icon'))

    expect(
      getByTestId('PoolCard/arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216')
    ).toBeTruthy()
    expect(
      queryByTestId('PoolCard/ethereum-sepolia:0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8')
    ).toBeFalsy()
  })
})
