import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import WithdrawSpend from 'src/fiatExchanges/WithdrawSpend'
import { navigate } from 'src/navigator/NavigationService'
import { createMockStore } from 'test/utils'

describe('WithdrawSpend', () => {
  it('renders correctly', () => {
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <WithdrawSpend />
      </Provider>
    )
    expect(tree.queryByTestId('FiatExchange/DrawerBar')).toBeFalsy()
    expect(tree.queryByTestId('FiatExchangeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('addFunds')).toBeFalsy()
    expect(tree.queryByTestId('spend')).toBeTruthy()
    expect(tree.queryByTestId('cashOut')).toBeTruthy()
  })

  it.each([
    { flow: 'CashOut', testID: 'cashOut' },
    { flow: 'Spend', testID: 'spend' },
  ])('$flow navigates correctly', ({ flow, testID }) => {
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <WithdrawSpend />
      </Provider>
    )
    fireEvent.press(tree.getByTestId(testID))
    expect(navigate).toHaveBeenCalledWith('FiatExchangeCurrencyBottomSheet', { flow })
  })
})
