import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PointsDiscoverCard from 'src/points/PointsDiscoverCard'
import { RootState } from 'src/redux/store'
import { getFeatureGate } from 'src/statsig/index'
import { RecursivePartial, createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')

const renderPointsDiscoverCard = (storeOverrides?: RecursivePartial<RootState>) => {
  const store = createMockStore(storeOverrides)

  const tree = render(
    <Provider store={store}>
      <PointsDiscoverCard />
    </Provider>
  )

  return {
    store,
    ...tree,
  }
}

describe('PointsDiscoverCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  it('renders when feature gate is enabled', () => {
    const { getByText } = renderPointsDiscoverCard({ points: { pointsBalance: 'BALANCE_AMOUNT' } })

    expect(getByText('points.discoverCard.title')).toBeTruthy()
    expect(getByText('points.discoverCard.description')).toBeTruthy()
    expect(getByText('BALANCE_AMOUNT')).toBeTruthy()
  })

  it('does not render when feature gate is disabled', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)

    const { queryByText } = renderPointsDiscoverCard()

    expect(queryByText('points.discoverCard.title')).toBeFalsy()
    expect(queryByText('points.discoverCard.description')).toBeFalsy()
  })

  it('tracks analytics event when pressed', () => {
    const { getByText } = renderPointsDiscoverCard()

    fireEvent.press(getByText('points.discoverCard.title'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_discover_press)
  })

  it('takes to the points intro screen if it has not been dismissed', () => {
    const { getByText } = renderPointsDiscoverCard()

    fireEvent.press(getByText('points.discoverCard.title'))
    expect(navigate).toHaveBeenCalledWith(Screens.PointsIntro)
  })

  it('takes to the points home screen if intro has been dismissed', () => {
    const { getByText } = renderPointsDiscoverCard({ points: { introHasBeenDismissed: true } })

    fireEvent.press(getByText('points.discoverCard.title'))
    expect(navigate).toHaveBeenCalledWith(Screens.PointsHome)
  })
})
