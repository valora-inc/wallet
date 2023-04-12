import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import ActionsCarousel from 'src/home/ActionsCarousel'
import { HomeActionName } from 'src/home/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { mocked } from 'ts-jest/utils'

describe('ActionsCarousel', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders all actions', () => {
    const { getAllByTestId } = render(<ActionsCarousel />)

    expect(getAllByTestId(/HomeAction-/)).toHaveLength(6)
  })

  it.each([
    [HomeActionName.Send, 'send', Screens.Send, undefined, HomeEvents.home_actions_send],
    [
      HomeActionName.Receive,
      'receive',
      Screens.QRNavigator,
      undefined,
      HomeEvents.home_actions_receive,
    ],
    [
      HomeActionName.Add,
      'add',
      Screens.FiatExchangeCurrency,
      { flow: FiatExchangeFlow.CashIn },
      HomeEvents.home_actions_add,
    ],
    [HomeActionName.Swap, 'swap', Screens.SwapScreen, undefined, HomeEvents.home_actions_swap],
    [
      HomeActionName.Request,
      'request',
      Screens.Send,
      { isOutgoingPaymentRequest: true },
      HomeEvents.home_actions_request,
    ],
    [
      HomeActionName.Withdraw,
      'withdraw',
      Screens.WithdrawSpend,
      undefined,
      HomeEvents.home_actions_withdraw,
    ],
  ])(
    'renders title and navigates to appropriate screen for %s',
    (name, title, screen, screenOptions, event) => {
      const { getByTestId } = render(<ActionsCarousel />)
      expect(
        within(getByTestId(`HomeAction/Title-${name}`)).getByText(`homeActions.${title}`)
      ).toBeTruthy()

      fireEvent.press(getByTestId(`HomeAction-${name}`))

      expect(navigate).toHaveBeenCalledTimes(1)
      // NOTE: cannot use calledWith(screen, screenOptions) because undefined
      // isn't explicitly passed for screens with no options and the expect fails
      expect(mocked(navigate).mock.calls[0][0]).toEqual(screen)
      expect(mocked(navigate).mock.calls[0][1]).toEqual(screenOptions)

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(event)
    }
  )
})
