import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
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
    [HomeActionName.Send, 'send', Screens.Send, undefined],
    [HomeActionName.Receive, 'homeActions.receive', Screens.QRNavigator, undefined],
    [
      HomeActionName.Add,
      'homeActions.add',
      Screens.FiatExchangeCurrency,
      { flow: FiatExchangeFlow.CashIn },
    ],
    [HomeActionName.Swap, 'homeActions.swap', Screens.SwapScreen, undefined],
    [HomeActionName.Request, 'request', Screens.Send, { isOutgoingPaymentRequest: true }],
    [HomeActionName.Withdraw, 'withdraw', Screens.FiatExchange, undefined],
  ])(
    'renders title and navigates to appropriate screen for %s',
    (name, title, screen, screenOptions) => {
      const { getByTestId } = render(<ActionsCarousel />)
      expect(within(getByTestId(`HomeAction/Title-${name}`)).getByText(title)).toBeTruthy()

      fireEvent.press(getByTestId(`HomeAction-${name}`))

      expect(navigate).toHaveBeenCalledTimes(1)
      // NOTE: cannot use calledWith(screen, screenOptions) because undefined
      // isn't explicitly passed for screens with no options and the expect fails
      expect(mocked(navigate).mock.calls[0][0]).toEqual(screen)
      expect(mocked(navigate).mock.calls[0][1]).toEqual(screenOptions)
    }
  )
})
