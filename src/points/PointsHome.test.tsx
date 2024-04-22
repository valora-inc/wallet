import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PointsHome from 'src/points/PointsHome'
import { getHistoryStarted, getPointsConfigRetry } from 'src/points/slice'
import { PointsActivityId } from 'src/points/types'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/points/PointsHistoryBottomSheet')

const mockScreenProps = () => getMockStackScreenProps(Screens.PointsHome)

const renderPointsHome = (
  pointsConfigStatus: 'idle' | 'loading' | 'error' | 'success' = 'success',
  activitiesById?: {
    [activityId in PointsActivityId]?: {
      pointsAmount: number
    }
  }
) => {
  const store = createMockStore({
    points: {
      pointsConfig: {
        activitiesById: activitiesById ?? {
          swap: {
            pointsAmount: 50,
          },
          'create-wallet': {
            pointsAmount: 20,
          },
        },
      },
      pointsConfigStatus,
    },
  })
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
    const { getByText, queryByText } = renderPointsHome('loading')

    expect(getByText('points.loading.title')).toBeTruthy()
    expect(getByText('points.loading.description')).toBeTruthy()
    expect(queryByText('points.error.title')).toBeFalsy()
    expect(queryByText('points.title')).toBeFalsy()
  })

  it('renders the error state on failure to load config', async () => {
    const { getByText, queryByText, store } = renderPointsHome('error')

    expect(getByText('points.error.title')).toBeTruthy()
    expect(getByText('points.error.description')).toBeTruthy()
    expect(queryByText('points.loading.title')).toBeFalsy()
    expect(queryByText('points.title')).toBeFalsy()

    store.clearActions()
    fireEvent.press(getByText('points.error.retryCta'))

    expect(store.getActions()).toEqual([getPointsConfigRetry()])
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
    const { getByTestId, getByText, queryByText } = renderPointsHome('success', {})

    expect(getByText('points.title')).toBeTruthy()
    expect(getByText('50')).toBeTruthy() // balance
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
