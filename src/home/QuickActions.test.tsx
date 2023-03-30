import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import QuickActions from 'src/home/QuickActions'
import { QuickActionName } from 'src/home/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { mocked } from 'ts-jest/utils'

describe('QuickActions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders all actions', () => {
    const { getAllByTestId } = render(<QuickActions />)

    expect(getAllByTestId(/QuickAction-/)).toHaveLength(6)
  })

  it.each([
    [QuickActionName.Send, 'send', Screens.Send, undefined],
    [QuickActionName.Receive, 'quickActions.receive', Screens.QRNavigator, undefined],
    [
      QuickActionName.Add,
      'quickActions.add',
      Screens.FiatExchangeCurrency,
      { flow: FiatExchangeFlow.CashIn },
    ],
    [QuickActionName.Swap, 'quickActions.swap', Screens.SwapScreen, undefined],
    [QuickActionName.Request, 'request', Screens.Send, { isOutgoingPaymentRequest: true }],
    [QuickActionName.Withdraw, 'withdraw', Screens.FiatExchange, undefined],
  ])(
    'renders title and navigates to appropriate screen for %s',
    (name, title, screen, screenOptions) => {
      const { getByTestId } = render(<QuickActions />)
      expect(within(getByTestId(`QuickAction/Title-${name}`)).getByText(title)).toBeTruthy()

      fireEvent.press(getByTestId(`QuickAction-${name}`))

      expect(navigate).toHaveBeenCalledTimes(1)
      // NOTE: cannot use calledWith(screen, screenOptions) because undefined
      // isn't explicitly passed for screens with no options and the expect fails
      expect(mocked(navigate).mock.calls[0][0]).toEqual(screen)
      expect(mocked(navigate).mock.calls[0][1]).toEqual(screenOptions)
    }
  )
})
