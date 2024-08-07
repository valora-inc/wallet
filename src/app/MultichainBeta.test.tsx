import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { AppEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import MultichainBeta from 'src/app/MultichainBeta'
import { MultichainBetaStatus, optMultichainBeta } from 'src/app/actions'
import { navigateHome } from 'src/navigator/NavigationService'
import { patchUpdateStatsigUser } from 'src/statsig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

describe('MultichainBeta', () => {
  const store = createMockStore()

  beforeEach(() => {
    jest.clearAllMocks()
    store.clearActions()
    jest.mocked(patchUpdateStatsigUser).mockResolvedValue()
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

  it('opt in updates statsig user and navigates home', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={MultichainBeta} />
      </Provider>
    )

    fireEvent.press(getByTestId('MultichainBeta/OptIn'))
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(AppEvents.multichain_beta_opt_in)
    expect(store.getActions()).toEqual([optMultichainBeta(true)])
    expect(patchUpdateStatsigUser).toHaveBeenCalledWith({
      custom: { multichainBetaStatus: MultichainBetaStatus.OptedIn },
    })
    await waitFor(() => {
      expect(navigateHome).toHaveBeenCalledTimes(1)
    })
  })

  it('opt out updates statsig user navigates home', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={MultichainBeta} />
      </Provider>
    )

    fireEvent.press(getByTestId('MultichainBeta/OptOut'))
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(AppEvents.multichain_beta_opt_out)
    expect(store.getActions()).toEqual([optMultichainBeta(false)])
    expect(patchUpdateStatsigUser).toHaveBeenCalledWith({
      custom: { multichainBetaStatus: MultichainBetaStatus.OptedOut },
    })
    await waitFor(() => {
      expect(navigateHome).toHaveBeenCalledTimes(1)
    })
  })

  it('buttons are disabled if status is opted in', async () => {
    const store = createMockStore({ app: { multichainBetaStatus: MultichainBetaStatus.OptedIn } })
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={MultichainBeta} />
      </Provider>
    )

    expect(getByTestId('MultichainBeta/OptIn')).toBeDisabled()
    expect(getByTestId('MultichainBeta/OptOut')).toBeDisabled()
    expect(getByTestId('MultichainBeta/OptIn')).toContainElement(getByTestId('Button/Loading'))
    expect(getByTestId('MultichainBeta/OptOut')).not.toContainElement(getByTestId('Button/Loading'))
  })

  it('buttons are disabled if status is opted out', async () => {
    const store = createMockStore({ app: { multichainBetaStatus: MultichainBetaStatus.OptedOut } })
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={MultichainBeta} />
      </Provider>
    )

    expect(getByTestId('MultichainBeta/OptIn')).toBeDisabled()
    expect(getByTestId('MultichainBeta/OptOut')).toBeDisabled()
    expect(getByTestId('MultichainBeta/OptOut')).toContainElement(getByTestId('Button/Loading'))
    expect(getByTestId('MultichainBeta/OptIn')).not.toContainElement(getByTestId('Button/Loading'))
  })
})
