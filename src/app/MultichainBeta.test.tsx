import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import MultichainBeta from 'src/app/MultichainBeta'
import { navigateHome } from 'src/navigator/NavigationService'
import MockedNavigator from 'test/MockedNavigator'

describe('MultichainBeta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<MockedNavigator component={MultichainBeta} />)

    expect(getByTestId('BetaTag')).toBeTruthy()
    expect(getByText('multichainBeta.title')).toBeTruthy()
    expect(getByText('multichainBeta.description1')).toBeTruthy()
    expect(getByText('multichainBeta.description2')).toBeTruthy()
    expect(getByTestId('MultichainBeta/OptIn')).toBeTruthy()
    expect(getByTestId('MultichainBeta/OptOut')).toBeTruthy()
  })

  it('opt in navigates home', () => {
    const { getByTestId } = render(<MockedNavigator component={MultichainBeta} />)

    fireEvent.press(getByTestId('MultichainBeta/OptIn'))
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.multichain_beta_opt_in)
  })

  it('opt out navigates home', () => {
    const { getByTestId } = render(<MockedNavigator component={MultichainBeta} />)

    fireEvent.press(getByTestId('MultichainBeta/OptOut'))
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.multichain_beta_opt_out)
  })
})
