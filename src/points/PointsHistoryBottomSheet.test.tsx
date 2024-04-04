import * as React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import PointsHistoryBottomSheet from 'src/points/PointsHistoryBottomSheet'
import { createMockStore } from 'test/utils'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import { getInitialHistoryStarted } from 'src/points/slice'

describe(PointsHistoryBottomSheet, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Displays content when idle', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHistoryBottomSheet forwardedRef={{ current: null }} />
      </Provider>
    )
    expect(getByTestId('PointsHistoryBottomSheet/MainContent')).toBeTruthy()
  })

  it('Displays content while loading more', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ points: { getHistoryStatus: 'loading-more' } })}>
        <PointsHistoryBottomSheet forwardedRef={{ current: null }} />
      </Provider>
    )
    expect(getByTestId('PointsHistoryBottomSheet/MainContent')).toBeTruthy()
  })

  it('Shows loading screen while loading initial data', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ points: { getHistoryStatus: 'loading-initial' } })}>
        <PointsHistoryBottomSheet forwardedRef={{ current: null }} />
      </Provider>
    )
    expect(getByTestId('PointsHistoryBottomSheet/LoadingState')).toBeTruthy()
  })

  it('Shows error screen if fetch fails', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ points: { getHistoryStatus: 'error' } })}>
        <PointsHistoryBottomSheet forwardedRef={{ current: null }} />
      </Provider>
    )
    expect(getByTestId('PointsHistoryBottomSheet/ErrorState')).toBeTruthy()
  })

  it('Dispatches action when try again is pressed', async () => {
    const store = createMockStore({ points: { getHistoryStatus: 'error' } })
    store.dispatch = jest.fn()

    const { getByTestId } = render(
      <Provider store={store}>
        <PointsHistoryBottomSheet forwardedRef={{ current: null }} />
      </Provider>
    )
    fireEvent.press(getByTestId('PointsHistoryBottomSheet/TryAgain'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        PointsEvents.points_screen_activity_try_again_press
      )
    )
    expect(store.dispatch).toHaveBeenCalledWith(getInitialHistoryStarted())
  })
})
