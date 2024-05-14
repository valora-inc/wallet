import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import PointsIntro from 'src/points/PointsIntro'
import { pointsIntroDismissed } from 'src/points/slice'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/points/PointsHistoryBottomSheet')

const mockScreenProps = () => getMockStackScreenProps(Screens.PointsIntro)

describe(PointsIntro, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const store = createMockStore()

    const { getByText } = render(
      <Provider store={store}>
        <PointsIntro {...mockScreenProps()} />
      </Provider>
    )

    expect(getByText('points.intro.title')).toBeTruthy()
    expect(getByText('points.intro.description')).toBeTruthy()

    fireEvent.press(getByText('points.intro.cta'))
    expect(store.getActions()).toContainEqual(pointsIntroDismissed())
  })
})
