import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import * as config from 'src/config'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import ActionsCarousel from 'src/home/ActionsCarousel'
import { HomeActionName } from 'src/home/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

const mockConfig = jest.mocked(config)
const originalEnabledQuickActions = config.ENABLED_QUICK_ACTIONS

function getStore(shouldShowSwapAction: boolean) {
  return createMockStore({
    app: {
      showSwapMenuInDrawerMenu: shouldShowSwapAction,
    },
  })
}

describe('ActionsCarousel', () => {
  let store: MockStoreEnhanced<{}>
  beforeEach(() => {
    store = getStore(true)
    mockConfig.ENABLED_QUICK_ACTIONS = originalEnabledQuickActions
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders all actions', () => {
    const { getAllByTestId } = render(
      <Provider store={store}>
        <ActionsCarousel />
      </Provider>
    )

    expect(getAllByTestId(/HomeAction-/)).toHaveLength(5)
  })

  it('does not render swap action when disabled', () => {
    store = getStore(false)
    const { queryByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <ActionsCarousel />
      </Provider>
    )

    expect(getAllByTestId(/HomeAction-/)).toHaveLength(4)
    expect(queryByTestId(`HomeAction/Title-Swap`)).toBeFalsy()
  })
  it.each([
    [HomeActionName.Send, 'send', Screens.SendSelectRecipient, undefined],
    [HomeActionName.Receive, 'receive', Screens.QRNavigator, { screen: Screens.QRCode }],
    [HomeActionName.Swap, 'swap', Screens.SwapScreenWithBack, undefined],
    [HomeActionName.Withdraw, 'withdraw', Screens.WithdrawSpend, undefined],
  ])(
    'renders title and navigates to appropriate screen for %s',
    (name, title, screen, screenOptions) => {
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionsCarousel />
        </Provider>
      )

      expect(
        within(getByTestId(`HomeAction/Title-${name}`)).getByText(`homeActions.${title}`)
      ).toBeTruthy()

      fireEvent.press(getByTestId(`HomeActionTouchable-${name}`))
      expect(navigate).toHaveBeenCalledTimes(1)
      // NOTE: cannot use calledWith(screen, screenOptions) because undefined
      // isn't explicitly passed for screens with no options and the expect fails
      expect(jest.mocked(navigate).mock.calls[0][0]).toEqual(screen)
      expect(jest.mocked(navigate).mock.calls[0][1]).toEqual(screenOptions)

      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.home_action_pressed, {
        action: name,
      })
    }
  )
  it('renders title and navigates to appropriate screen for add', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ActionsCarousel />
      </Provider>
    )

    expect(
      within(getByTestId(`HomeAction/Title-${HomeActionName.Add}`)).getByText(`homeActions.add`)
    ).toBeTruthy()

    fireEvent.press(getByTestId(`HomeActionTouchable-${HomeActionName.Add}`))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrencyBottomSheet, {
      flow: FiatExchangeFlow.CashIn,
    })

    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.home_action_pressed, {
      action: HomeActionName.Add,
    })
  })

  it('renders only the actions enabled from the config', () => {
    mockConfig.ENABLED_QUICK_ACTIONS = [HomeActionName.Send]

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <ActionsCarousel />
      </Provider>
    )

    expect(within(getByTestId(`HomeAction/Title-Send`)).getByText(`homeActions.send`)).toBeTruthy()
    expect(queryByTestId(`HomeAction/Title-Receive`)).toBeFalsy()
  })

  it('renders null if no actions are enabled', () => {
    mockConfig.ENABLED_QUICK_ACTIONS = []

    const { toJSON } = render(
      <Provider store={store}>
        <ActionsCarousel />
      </Provider>
    )

    expect(toJSON()).toBeNull()
  })
})
