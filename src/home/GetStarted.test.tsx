import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import GetStarted from 'src/home/GetStarted'
import { getFeatureGate } from 'src/statsig'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

describe('GetStarted', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('should display the correct text', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <GetStarted />
      </Provider>
    )

    expect(getByText('getStarted')).toBeTruthy()
    expect(getByText('getStartedHome.titleV1_86')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.title')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.description')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokens')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokensBody')).toBeTruthy()
    expect(store.getActions()).toEqual([])
  })

  it('should trigger button tap analytics event', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <GetStarted />
      </Provider>
    )

    fireEvent.press(getByTestId('GetStarted/Touchable'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_add_get_started_selected
    )
  })
})
