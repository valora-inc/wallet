import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import GetStarted from 'src/home/GetStarted'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')

describe('GetStarted', () => {
  it('should display the correct text', () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          app: {
            superchargeApy: 12,
          },
        })}
      >
        <GetStarted />
      </Provider>
    )

    expect(getByText('getStarted')).toBeTruthy()
    expect(getByText('getStartedHome.title')).toBeTruthy()
    expect(getByText('getStartedHome.body, {"apy":12}')).toBeTruthy()
  })

  it('should trigger impression analytics event', () => {
    render(
      <Provider
        store={createMockStore({
          app: {
            superchargeApy: 12,
          },
        })}
      >
        <GetStarted />
      </Provider>
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_add_get_started_impression
    )
  })

  it('should trigger button tap analytics event', () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          app: {
            superchargeApy: 12,
          },
        })}
      >
        <GetStarted />
      </Provider>
    )

    fireEvent.press(getByText('addFunds'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_add_get_started_selected
    )
  })
})
