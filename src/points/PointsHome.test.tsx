import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PointsHome from 'src/points/PointsHome'
import { getHistoryStarted, getPointsConfigRetry } from 'src/points/slice'
import { RootState } from 'src/redux/store'
import { RecursivePartial, createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/points/PointsHistoryBottomSheet')

const mockScreenProps = () => getMockStackScreenProps(Screens.PointsHome)

const renderPointsHome = (storeOverrides?: RecursivePartial<RootState>) => {
  const store = createMockStore(
    storeOverrides ?? {
      points: {
        pointsConfig: {
          activitiesById: {
            swap: {
              pointsAmount: 50,
            },
            'create-wallet': {
              pointsAmount: 20,
            },
          },
        },
        pointsConfigStatus: 'success',
      },
    }
  )
  const tree = render(
    <Provider store={store}>
      <PointsHome {...mockScreenProps()} />
    </Provider>
  )

  return {
    store,
    ...tree,
  }
}

describe(PointsHome, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a loading state while loading config', async () => {
    const { getByText, queryByText } = renderPointsHome({
      points: { pointsConfigStatus: 'loading' },
    })

    expect(getByText('points.loading.title')).toBeTruthy()
    expect(getByText('points.loading.description')).toBeTruthy()
    expect(queryByText('points.error.title')).toBeFalsy()
    expect(queryByText('points.title')).toBeFalsy()
  })

  it('renders the error state on failure to load config', async () => {
    const { getByText, queryByText, store } = renderPointsHome({
      points: { pointsConfigStatus: 'error' },
    })

    expect(getByText('points.error.title')).toBeTruthy()
    expect(getByText('points.error.description')).toBeTruthy()
    expect(queryByText('points.loading.title')).toBeFalsy()
    expect(queryByText('points.title')).toBeFalsy()

    store.clearActions()
    fireEvent.press(getByText('points.error.retryCta'))

    expect(store.getActions()).toEqual([getPointsConfigRetry()])
  })

  it('refreshes the balance and history on mount and on pull to refresh', async () => {
    const refreshPointsAndHistoryAction = getHistoryStarted({ getNextPage: false })
    const { store, getByTestId } = renderPointsHome()

    await waitFor(() => expect(store.getActions()).toEqual([refreshPointsAndHistoryAction]))

    // the below is the recommended way to test pull to refresh
    // https://github.com/callstack/react-native-testing-library/issues/809#issuecomment-1144703296
    const { refreshControl } = getByTestId('PointsScrollView').props
    refreshControl.props.onRefresh()

    await waitFor(() =>
      expect(store.getActions()).toEqual([
        refreshPointsAndHistoryAction,
        refreshPointsAndHistoryAction,
      ])
    )
  })

  it('displays an error toast on failure to refresh the balance and history', async () => {
    const { store, getByText } = renderPointsHome({
      points: {
        getHistoryStatus: 'errorFirstPage',
      },
    })

    expect(getByText('points.fetchBalanceError.title')).toBeTruthy()
    expect(getByText('points.fetchBalanceError.description')).toBeTruthy()

    store.clearActions()
    fireEvent.press(getByText('points.fetchBalanceError.retryCta'))

    await waitFor(() =>
      expect(store.getActions()).toEqual([getHistoryStarted({ getNextPage: false })])
    )
  })

  it('opens activity bottom sheet', async () => {
    const { getByTestId, store } = renderPointsHome()

    fireEvent.press(getByTestId('PointsActivityButton'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_activity_press)
    )
    expect(store.getActions()).toEqual([getHistoryStarted({ getNextPage: false })])
  })

  it('renders multiple sections', async () => {
    const { getByTestId, queryByTestId, queryByText } = renderPointsHome()

    expect(getByTestId('PointsActivitySection-50')).toBeTruthy()
    expect(getByTestId('PointsActivitySection-20')).toBeTruthy()

    expect(getByTestId('PointsActivityCard-swap-50')).toBeTruthy()
    expect(queryByTestId('PointsActivityCard-create-wallet-50')).toBeFalsy()

    expect(queryByTestId('PointsActivityCard-swap-20')).toBeFalsy()
    expect(getByTestId('PointsActivityCard-more-coming-20')).toBeTruthy()
    expect(getByTestId('PointsActivityCard-create-wallet-20')).toBeTruthy()

    expect(queryByText('points.loading.title')).toBeFalsy()
    expect(queryByText('points.error.title')).toBeFalsy()
  })

  it('renders only the balance if there are no supported activities', async () => {
    const { getByTestId, getByText, queryByText } = renderPointsHome({
      points: {
        pointsConfigStatus: 'success',
      },
    })

    expect(getByText('points.title')).toBeTruthy()
    expect(getByTestId('PointsBalance')).toBeTruthy() // balance is animated so we cannot properly test the value programatically
    expect(getByTestId('PointsActivityButton')).toBeTruthy()
    expect(getByText('points.noActivities.title')).toBeTruthy()
    expect(getByText('points.noActivities.body')).toBeTruthy()

    expect(queryByText('points.infoCard.title')).toBeFalsy()
    expect(queryByText('points.loading.title')).toBeFalsy()
    expect(queryByText('points.error.title')).toBeFalsy()
  })

  it('opens Swap bottom sheet', async () => {
    const { getByTestId } = renderPointsHome()
    fireEvent.press(getByTestId('PointsActivityCard-swap-50'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_press, {
        activityId: 'swap',
      })
    )
  })

  it('navigates to Swap screen on CTA press', async () => {
    const { getByTestId } = renderPointsHome()
    fireEvent.press(getByTestId('PointsActivityCard-swap-50'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_press, {
        activityId: 'swap',
      })
    )

    fireEvent.press(getByTestId('PointsHomeBottomSheetCtaButton'))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_cta_press, {
      activityId: 'swap',
    })
  })
})
