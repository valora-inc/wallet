import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import FiatExchangeCurrency from 'src/fiatExchanges/FiatExchangeCurrency'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { FiatExchangeFlow } from './utils'
import { getFeatureGate } from 'src/statsig'
import { Network } from 'src/transactions/types'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => false),
}))

const mockScreenProps = (flow: FiatExchangeFlow) =>
  getMockStackScreenProps(Screens.FiatExchangeCurrency, {
    flow,
  })

describe('FiatExchangeCurrency', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
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
      network: Network.Celo,
    })
  })
  it('cEUR Flow', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('radio/cEUR'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      currency: 'cEUR',
      flow: FiatExchangeFlow.CashIn,
      network: Network.Celo,
    })
  })
  it('CELO Flow', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('radio/CELO'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      currency: 'CELO',
      flow: FiatExchangeFlow.CashIn,
      network: Network.Celo,
    })
  })
  it('ETH Flow', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)
    const tree = render(
      <Provider store={createMockStore({})}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('radio/ETH'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      currency: 'ETH',
      flow: FiatExchangeFlow.CashIn,
      network: Network.Ethereum,
    })
  })
  it('Spend Flow', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.Spend)} />
      </Provider>
    )

    expect(tree.getByTestId('radio/CELO')).toBeDisabled()

    fireEvent.press(tree.getByTestId('radio/cEUR'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, {
      currency: 'cEUR',
    })
  })
})
