import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import PointsHistoryBottomSheet from 'src/points/PointsHistoryBottomSheet'
import { getHistoryStarted } from 'src/points/slice'
import { GetHistoryResponse } from 'src/points/types'
import { RootState } from 'src/redux/reducers'
import { RecursivePartial, createMockStore } from 'test/utils'

const MOCK_RESPONSE_NO_NEXT_PAGE: GetHistoryResponse = {
  data: [
    {
      activityId: 'deposit-earn',
      pointsAmount: 10,
      createdAt: '2024-03-05T20:26:25.000Z',
      metadata: {
        tokenId: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
      },
    },
    {
      activityId: 'create-live-link',
      pointsAmount: 10,
      createdAt: '2024-03-05T19:26:25.000Z',
      metadata: {
        liveLinkType: 'erc721',
      },
    },
    {
      activityId: 'create-live-link',
      pointsAmount: 20,
      createdAt: '2024-03-05T19:26:25.000Z',
      metadata: {
        liveLinkType: 'erc20',
        tokenId: 'celo-alfajores:native',
      },
    },
    {
      activityId: 'swap',
      pointsAmount: 20,
      createdAt: '2024-03-05T19:26:25.000Z',
      metadata: {
        to: 'celo-alfajores:native',
        from: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
      },
    },
    {
      activityId: 'swap',
      pointsAmount: 20,
      createdAt: '2024-03-05T19:26:25.000Z',
      metadata: {
        to: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
        from: 'celo-alfajores:native',
      },
    },
    {
      activityId: 'create-wallet',
      pointsAmount: 20,
      createdAt: '2023-12-04T19:26:25.000Z',
    },
  ],
  hasNextPage: false,
  nextPageUrl: '',
}

describe(PointsHistoryBottomSheet, () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  function renderScreen(storeOverrides: RecursivePartial<RootState> = {}) {
    const store = createMockStore({
      ...storeOverrides,
    })

    const dispatch = jest.spyOn(store, 'dispatch')

    const tree = render(
      <Provider store={store}>
        <PointsHistoryBottomSheet forwardedRef={{ current: null }} />
      </Provider>
    )

    return {
      dispatch,
      store,
      ...tree,
    }
  }

  it('shows empty state when no history', async () => {
    const tree = renderScreen()

    expect(tree.queryByTestId('PointsHistoryBottomSheet/Error')).toBeNull()
    expect(tree.queryByTestId('PointsHistoryBottomSheet/Error')).toBeNull()
    expect(tree.getByTestId('PointsHistoryBottomSheet/Empty')).toBeTruthy()
  })

  it('displays content while loading', async () => {
    const tree = renderScreen({
      points: { pointsHistory: MOCK_RESPONSE_NO_NEXT_PAGE.data, getHistoryStatus: 'loading' },
    })
    await waitFor(() => expect(tree.getByTestId('PointsHistoryList').props.data.length).toBe(2))

    expect(
      tree.getByText('points.history.cards.depositEarn.subtitle, {"network":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(
      tree.getByText('points.history.cards.createLiveLink.subtitle.erc20, {"tokenSymbol":"CELO"}')
    ).toBeTruthy()
    expect(tree.getByText('points.history.cards.createLiveLink.subtitle.erc721')).toBeTruthy()
    expect(
      tree.getByText('points.history.cards.swap.subtitle, {"fromToken":"CELO","toToken":"cUSD"}')
    ).toBeTruthy()
    expect(
      tree.getByText('points.history.cards.swap.subtitle, {"fromToken":"cUSD","toToken":"CELO"}')
    ).toBeTruthy()
    expect(tree.getByText('points.history.cards.createWallet.subtitle')).toBeTruthy()

    expect(tree.getByText('March', { exact: false })).toBeTruthy()
    expect(tree.getByText('December 2023')).toBeTruthy()
    expect(tree.getByTestId('PointsHistoryBottomSheet/Loading')).toBeTruthy()
  })

  it('fetches more content when bottom is visible', async () => {
    const { dispatch, getByTestId } = renderScreen({
      points: {
        pointsHistory: MOCK_RESPONSE_NO_NEXT_PAGE.data,
        getHistoryStatus: 'idle',
        nextPageUrl: 'foo',
      },
    })

    // Trigger end reached to fetch more
    getByTestId('PointsHistoryList').props.onEndReached()

    expect(dispatch).toHaveBeenCalledWith(getHistoryStarted({ getNextPage: true }))
  })

  it('shows error screen if fetch fails', async () => {
    const tree = renderScreen({ points: { getHistoryStatus: 'errorFirstPage' } })
    expect(tree.getByTestId('PointsHistoryBottomSheet/Error')).toBeTruthy()
  })

  it('dispatches an action when try again is pressed', async () => {
    const { dispatch, getByText } = renderScreen({ points: { getHistoryStatus: 'errorFirstPage' } })
    fireEvent.press(getByText('points.history.error.tryAgain'))
    await waitFor(() =>
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        PointsEvents.points_screen_activity_try_again_press,
        {
          getNextPage: false,
        }
      )
    )
    expect(dispatch).toHaveBeenCalledWith(getHistoryStarted({ getNextPage: false }))
  })

  it('shows empty screen if no info after fetch', async () => {
    const tree = renderScreen({ points: { getHistoryStatus: 'idle', pointsHistory: [] } })
    expect(tree.getByTestId('PointsHistoryBottomSheet/Empty')).toBeTruthy()
  })

  it('closes bottom sheet if got it is pressed', async () => {
    const { getByText } = renderScreen({ points: { getHistoryStatus: 'idle', pointsHistory: [] } })
    fireEvent.press(getByText('points.history.empty.gotIt'))
    await waitFor(() =>
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        PointsEvents.points_screen_activity_learn_more_press
      )
    )
  })

  it('shows inline error if failure while fetching subsequent page', async () => {
    const tree = renderScreen({
      points: { getHistoryStatus: 'errorNextPage', pointsHistory: MOCK_RESPONSE_NO_NEXT_PAGE.data },
    })
    expect(tree.getByTestId('PointsHistoryBottomSheet/ErrorBanner')).toBeTruthy()
  })

  it('refreshes if error banner CTA is pressed', async () => {
    const { dispatch, getByText } = renderScreen({
      points: { getHistoryStatus: 'errorNextPage', pointsHistory: MOCK_RESPONSE_NO_NEXT_PAGE.data },
    })
    fireEvent.press(getByText('points.history.pageError.refresh'))
    await waitFor(() =>
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        PointsEvents.points_screen_activity_try_again_press,
        {
          getNextPage: true,
        }
      )
    )
    expect(dispatch).toHaveBeenCalledWith(getHistoryStarted({ getNextPage: true }))
  })
})
