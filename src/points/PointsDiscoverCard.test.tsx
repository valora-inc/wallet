import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PointsDiscoverCard from 'src/points/PointsDiscoverCard'
import { getFeatureGate } from 'src/statsig/index'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')

describe('PointsDiscoverCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when feature gate is enabled', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)

    const { getByText } = render(
      <Provider store={createMockStore({ points: { pointsBalance: 'BALANCE_AMOUNT' } })}>
        <PointsDiscoverCard />
      </Provider>
    )

    expect(getByText('points.discoverCard.title')).toBeTruthy()
    expect(getByText('points.discoverCard.description')).toBeTruthy()
    expect(getByText('BALANCE_AMOUNT')).toBeTruthy()

    fireEvent.press(getByText('points.discoverCard.title'))

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_open)
    expect(navigate).toHaveBeenCalledWith(Screens.PointsHome)
  })

  it('does not render when feature gate is disabled', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)

    const { queryByText } = render(
      <Provider store={createMockStore()}>
        <PointsDiscoverCard />
      </Provider>
    )

    expect(queryByText('points.discoverCard.title')).toBeFalsy()
    expect(queryByText('points.discoverCard.description')).toBeFalsy()
  })
})
