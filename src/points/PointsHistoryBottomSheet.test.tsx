import * as React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import PointsHistoryBottomSheet from 'src/points/PointsHistoryBottomSheet'
import { createMockStore, RecursivePartial } from 'test/utils'
import { RootState } from 'src/redux/reducers'
import { FetchMock } from 'jest-fetch-mock/types'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import { getHistoryStarted } from 'src/points/slice'
import { GetHistoryResponse } from 'src/points/types'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn().mockReturnValue({
    showSwap: ['celo-alfajores'],
  }),
}))

const MOCK_RESPONSE_NO_NEXT_PAGE: GetHistoryResponse = {
  data: [
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
      createdAt: '2024-01-04T19:26:25.000Z',
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
    expect(tree.queryByTestId('PointsHistoryBottomSheet/Empty')).toBeTruthy()
  })

  it('displays content while loading', async () => {
    const tree = renderScreen({
      points: { pointsHistory: MOCK_RESPONSE_NO_NEXT_PAGE.data, getHistoryStatus: 'loading' },
    })
    await waitFor(() => expect(tree.getByTestId('PointsHistoryList').props.data.length).toBe(3))

    expect(
      tree.getByText('points.history.cards.swap.subtitle, {"fromToken":"CELO","toToken":"cUSD"}')
    ).toBeTruthy()
    expect(
      tree.getByText('points.history.cards.swap.subtitle, {"fromToken":"cUSD","toToken":"CELO"}')
    ).toBeTruthy()
    expect(tree.getByText('points.history.cards.createWallet.subtitle')).toBeTruthy()

    expect(tree.getByText('January')).toBeTruthy()
    expect(tree.getByText('March')).toBeTruthy()
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
    const tree = renderScreen({ points: { getHistoryStatus: 'error' } })
    expect(tree.getByTestId('PointsHistoryBottomSheet/Error')).toBeTruthy()
  })

  it('dispatches an action when try again is pressed', async () => {
    const { dispatch, getByText } = renderScreen({ points: { getHistoryStatus: 'error' } })
    fireEvent.press(getByText('points.history.error.tryAgain'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        PointsEvents.points_screen_activity_try_again_press
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
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        PointsEvents.points_screen_activity_learn_more_press
      )
    )
  })
})
