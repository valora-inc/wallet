import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'
import PointsIntro from 'src/points/PointsIntro'
import { pointsIntroDismissed } from 'src/points/slice'
import { waitFor } from 'src/redux/sagas-helpers'
import { RootState } from 'src/redux/store'
import MockedNavigator from 'test/MockedNavigator'
import { RecursivePartial, createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')

const mockScreenProps = () => getMockStackScreenProps(Screens.PointsIntro)

const renderPointsIntro = (storeOverrides?: RecursivePartial<RootState>) => {
  const store = createMockStore(storeOverrides)

  const tree = render(
    <Provider store={store}>
      <MockedNavigator component={PointsIntro} params={mockScreenProps()} />
    </Provider>
  )

  return {
    store,
    ...tree,
  }
}

describe(PointsIntro, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText } = renderPointsIntro()

    expect(getByText('points.intro.title')).toBeTruthy()
    expect(getByText('points.intro.description')).toBeTruthy()
  })

  it('updates the redux state on dismiss', () => {
    const { store, getByText } = renderPointsIntro()

    fireEvent.press(getByText('points.intro.cta'))
    expect(store.getActions()).toContainEqual(pointsIntroDismissed())
  })

  it('tracks analytics event on dismiss', () => {
    const { getByText } = renderPointsIntro()

    fireEvent.press(getByText('points.intro.cta'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_intro_dismiss)
  })

  it('tracks analytics event when navigated back', () => {
    const { getByTestId } = renderPointsIntro()

    fireEvent.press(getByTestId('BackChevron'))
    waitFor(() => {
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_intro_back)
    })
  })
})
