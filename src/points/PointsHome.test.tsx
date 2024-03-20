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
            name: 'CreateWallet',
          },
          {
            name: 'Swap',
          },
          {
            name: 'MoreComing',
          },
          {
            name: 'Foo',
          },
        ],
      },
      {
        points: 20,
        activities: [
          {
            name: 'MoreComing',
          },
          {
            name: 'CreateWallet',
          },
        ],
      },
      {
        points: 0,
        activities: [
          {
            name: 'MoreComing',
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

    expect(getByTestId('SwapActivityCard-50')).toBeTruthy()
    expect(getByTestId('MoreComingActivityCard-50')).toBeTruthy()
    expect(getByTestId('CreateWalletActivityCard-50')).toBeTruthy()

    expect(queryByTestId('SwapActivityCard-20')).toBeFalsy()
    expect(getByTestId('MoreComingActivityCard-20')).toBeTruthy()
    expect(getByTestId('CreateWalletActivityCard-20')).toBeTruthy()
  })

  it('ignores unknown activities', async () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHome {...mockScreenProps()} />
      </Provider>
    )
    expect(queryByTestId('FooActivityCard-50')).toBeFalsy()
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
    fireEvent.press(getByTestId('SwapActivityCard-50'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_swap_card_press)
    )
  })

  it('navigates to Swap screen on CTA press', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <PointsHome {...mockScreenProps()} />
      </Provider>
    )
    fireEvent.press(getByTestId('SwapActivityCard-50'))
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_swap_card_press)
    )

    fireEvent.press(getByTestId('PointsHomeBottomSheetCtaButton'))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack))
  })
})
