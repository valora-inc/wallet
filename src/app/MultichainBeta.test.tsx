import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import MultichainBeta from 'src/app/MultichainBeta'
import { optMultichainBeta } from 'src/app/actions'
import { navigateHome } from 'src/navigator/NavigationService'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

describe('MultichainBeta', () => {
  const store = createMockStore()

  beforeEach(() => {
    jest.clearAllMocks()
    store.clearActions()
  })

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={MultichainBeta} />
      </Provider>
    )

    expect(getByTestId('BetaTag')).toBeTruthy()
    expect(getByText('multichainBeta.title')).toBeTruthy()
    expect(getByText('multichainBeta.description1')).toBeTruthy()
    expect(getByText('multichainBeta.description2')).toBeTruthy()
    expect(getByTestId('MultichainBeta/OptIn')).toBeTruthy()
    expect(getByTestId('MultichainBeta/OptOut')).toBeTruthy()
  })

  it('opt in navigates home', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={MultichainBeta} />
      </Provider>
    )

    fireEvent.press(getByTestId('MultichainBeta/OptIn'))
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.multichain_beta_opt_in)
    expect(store.getActions()).toEqual([optMultichainBeta(true)])
  })

  it('opt out navigates home', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={MultichainBeta} />
      </Provider>
    )

    fireEvent.press(getByTestId('MultichainBeta/OptOut'))
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.multichain_beta_opt_out)
    expect(store.getActions()).toEqual([optMultichainBeta(false)])
  })
})
