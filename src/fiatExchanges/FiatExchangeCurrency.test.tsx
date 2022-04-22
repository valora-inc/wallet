import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import FiatExchangeCurrency from 'src/fiatExchanges/FiatExchangeCurrency'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { navigate } from 'src/navigator/NavigationService'
import { FiatExchangeFlow } from './utils'

const mockScreenProps = (flow: FiatExchangeFlow) =>
  getMockStackScreenProps(Screens.FiatExchangeCurrency, {
    flow,
  })

describe('FiatExchangeCurrency', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )
    expect(tree.getByText('(cUSD)')).toBeTruthy()
    expect(tree.getByText('(cEUR)')).toBeTruthy()
    expect(tree.getByText('CELO')).toBeTruthy()

    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      currency: 'cUSD',
      flow: FiatExchangeFlow.CashIn,
    })
  })
})
