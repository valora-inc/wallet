import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PointsHome from 'src/points/PointsHome'
import { getHistoryStarted } from 'src/points/slice'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = () => getMockStackScreenProps(Screens.PointsHome)

const renderPointsHome = () => {
  const store = createMockStore({
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

  it('opens activity bottom sheet', async () => {
    const { getByTestId, store } = renderPointsHome()

    fireEvent.press(getByTestId('PointsActivityButton'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_activity_press)
    )
    expect(store.getActions()).toEqual([getHistoryStarted({ getNextPage: false })])
  })

  it('renders multiple sections', async () => {
    const { getByTestId, queryByTestId } = renderPointsHome()

    expect(getByTestId('PointsActivitySection-50')).toBeTruthy()
    expect(getByTestId('PointsActivitySection-20')).toBeTruthy()

    expect(getByTestId('PointsActivityCard-swap-50')).toBeTruthy()
    expect(queryByTestId('PointsActivityCard-create-wallet-50')).toBeFalsy()

    expect(queryByTestId('PointsActivityCard-swap-20')).toBeFalsy()
    expect(getByTestId('PointsActivityCard-more-coming-20')).toBeTruthy()
    expect(getByTestId('PointsActivityCard-create-wallet-20')).toBeTruthy()
  })

  it('opens Swap bottom sheet', async () => {
    const { getByTestId } = renderPointsHome()
    fireEvent.press(getByTestId('PointsActivityCard-swap-50'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_press, {
        activity: 'swap',
      })
    )
  })

  it('navigates to Swap screen on CTA press', async () => {
    const { getByTestId } = renderPointsHome()
    fireEvent.press(getByTestId('PointsActivityCard-swap-50'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_press, {
        activity: 'swap',
      })
    )

    fireEvent.press(getByTestId('PointsHomeBottomSheetCtaButton'))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_cta_press, {
      activity: 'swap',
    })
  })
})
