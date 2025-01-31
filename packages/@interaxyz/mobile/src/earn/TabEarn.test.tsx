import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { Status } from 'src/earn/slice'
import TabEarn from 'src/earn/TabEarn'
import { EarnTabType } from 'src/earn/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockEarnPositions, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

function getStore(
  mockPoolBalance: string = '0',
  mockStatus: Status = 'success',
  mockPositionsFetchedAt: number = Date.now(),
  emptyPositions = false
) {
  return createMockStore({
    tokens: {
      tokenBalances: {
        ...mockTokenBalances,
      },
    },
    positions: {
      positions: emptyPositions
        ? []
        : [
            {
              ...mockEarnPositions[0],
              balance: mockPoolBalance,
            },
            mockEarnPositions[1],
          ],
      earnPositionIds: emptyPositions
        ? []
        : mockEarnPositions.map((position) => position.positionId),
      status: mockStatus,
      positionsFetchedAt: mockPositionsFetchedAt,
    },
  })
}

describe('TabEarn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS
      )
  })
  it('shows the zero state UI under my positions if the user has no pools with balance', () => {
    const { getByText } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={TabEarn}
          params={{
            activeEarnTab: EarnTabType.MyPools,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.home.noPoolsTitle')).toBeTruthy()
  })
  it('shows the error state if position fetching fails', () => {
    const { getByText } = render(
      <Provider store={getStore('0', 'error', Date.now(), true)}>
        <MockedNavigator
          component={TabEarn}
          params={{
            activeEarnTab: EarnTabType.AllPools,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.home.errorTitle')).toBeTruthy()
    expect(getByText('earnFlow.home.errorButton')).toBeTruthy()
    fireEvent.press(getByText('earnFlow.home.errorButton'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_home_error_try_again)
  })
  it('shows the error state if fetched positions are stale', () => {
    const { getByText } = render(
      <Provider store={getStore('0', 'error', Date.now() - ONE_DAY_IN_MILLIS)}>
        <MockedNavigator
          component={TabEarn}
          params={{
            activeEarnTab: EarnTabType.AllPools,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.home.errorTitle')).toBeTruthy()
    expect(getByText('earnFlow.home.errorButton')).toBeTruthy()
    fireEvent.press(getByText('earnFlow.home.errorButton'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_home_error_try_again)
  })
  it('renders all pools correctly', () => {
    const { getByTestId, queryAllByTestId } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={TabEarn}
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

  it('correctly shows pool under my positions if has balance', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider store={getStore('10')}>
        <MockedNavigator
          component={TabEarn}
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
})
