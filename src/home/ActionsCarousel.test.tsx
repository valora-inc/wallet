import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import ActionsCarousel from 'src/home/ActionsCarousel'
import { HomeActionName } from 'src/home/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

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

    expect(getAllByTestId(/HomeAction-/)).toHaveLength(6)
  })

  it('does not render swap action when disabled', () => {
    store = getStore(false)
    const { queryByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <ActionsCarousel />
      </Provider>
    )

    expect(getAllByTestId(/HomeAction-/)).toHaveLength(5)
    expect(queryByTestId(`HomeAction/Title-Swap`)).toBeFalsy()
  })
  it.each([
    [HomeActionName.Send, 'send', Screens.Send, undefined],
    [HomeActionName.Receive, 'receive', Screens.QRNavigator, { screen: Screens.QRCode }],
    [HomeActionName.Add, 'add', Screens.FiatExchangeCurrency, { flow: FiatExchangeFlow.CashIn }],
    [HomeActionName.Swap, 'swap', Screens.SwapScreenWithBack, undefined],
    [HomeActionName.Request, 'request', Screens.Send, { isOutgoingPaymentRequest: true }],
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

      fireEvent.press(getByTestId(`HomeAction-${name}`))

      expect(navigate).toHaveBeenCalledTimes(1)
      // NOTE: cannot use calledWith(screen, screenOptions) because undefined
      // isn't explicitly passed for screens with no options and the expect fails
      expect(jest.mocked(navigate).mock.calls[0][0]).toEqual(screen)
      expect(jest.mocked(navigate).mock.calls[0][1]).toEqual(screenOptions)

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.home_action_pressed, {
        action: name,
      })
    }
  )
})
