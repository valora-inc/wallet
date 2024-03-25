import * as React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import PointsHome from 'src/points/PointsHome'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { PointsEvents } from 'src/analytics/Events'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn().mockReturnValue({
    pointsMetadata: [
      {
        points: 50,
        activities: [
          {
            name: 'create-wallet',
          },
          {
            name: 'swap',
          },
          {
            name: 'more-coming',
          },
          {
            name: 'foo',
          },
        ],
      },
      {
        points: 20,
        activities: [
          {
            name: 'more-coming',
          },
          {
            name: 'create-wallet',
          },
        ],
      },
      {
        points: 0,
        activities: [
          {
            name: 'more-coming',
          },
        ],
      },
    ],
  }),
}))

const mockScreenProps = () => getMockStackScreenProps(Screens.PointsHome)

describe(PointsHome, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders multiple sections', async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHome {...mockScreenProps()} />
      </Provider>
    )
    expect(getByTestId('PointsActivitySection-50')).toBeTruthy()
    expect(getByTestId('PointsActivitySection-20')).toBeTruthy()

    expect(getByTestId('PointsActivityCard-swap-50')).toBeTruthy()
    expect(getByTestId('PointsActivityCard-more-coming-50')).toBeTruthy()
    expect(getByTestId('PointsActivityCard-create-wallet-50')).toBeTruthy()

    expect(queryByTestId('PointsActivityCard-swap-20')).toBeFalsy()
    expect(getByTestId('PointsActivityCard-more-coming-20')).toBeTruthy()
    expect(getByTestId('PointsActivityCard-create-wallet-20')).toBeTruthy()
  })

  it('ignores unknown activities', async () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHome {...mockScreenProps()} />
      </Provider>
    )
    expect(queryByTestId('PointsActivityCard-foo-50')).toBeFalsy()
  })

  it('ignores 0 point value activities', async () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHome {...mockScreenProps()} />
      </Provider>
    )
    expect(queryByTestId('PointsActivitySection-0')).toBeFalsy()
  })

  it('opens Swap bottom sheet', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHome {...mockScreenProps()} />
      </Provider>
    )
    fireEvent.press(getByTestId('PointsActivityCard-swap-50'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_press, {
        activity: 'swap',
      })
    )
  })

  it('navigates to Swap screen on CTA press', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHome {...mockScreenProps()} />
      </Provider>
    )
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
