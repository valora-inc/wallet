import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import FiatExchangeCurrency from 'src/fiatExchanges/FiatExchangeCurrency'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCeloTokenId, mockCeurTokenId, mockCusdTokenId, mockEthTokenId } from 'test/values'
import { FiatExchangeFlow } from './utils'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(() => {
    return {
      showCico: ['celo-alfajores'],
    }
  }),
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
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )
    expect(store.getActions()).toEqual([fetchFiatConnectProviders()])
    expect(tree.getByText('(cUSD)')).toBeTruthy()
    expect(tree.getByText('(cEUR)')).toBeTruthy()
    expect(tree.getByText('CELO')).toBeTruthy()

    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockCusdTokenId,
      flow: FiatExchangeFlow.CashIn,
      tokenSymbol: 'cUSD',
    })
  })
  it('cEUR Flow', () => {
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchFiatConnectProviders()])
    fireEvent.press(tree.getByTestId('radio/cEUR'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockCeurTokenId,
      flow: FiatExchangeFlow.CashIn,
      tokenSymbol: 'cEUR',
    })
  })
  it('CELO Flow', () => {
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchFiatConnectProviders()])
    fireEvent.press(tree.getByTestId('radio/CELO'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockCeloTokenId,
      flow: FiatExchangeFlow.CashIn,
      tokenSymbol: 'CELO',
    })
  })
  it('ETH Flow', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showCico: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.CashIn)} />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchFiatConnectProviders()])
    fireEvent.press(tree.getByTestId('radio/ETH'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockEthTokenId,
      flow: FiatExchangeFlow.CashIn,
      tokenSymbol: 'ETH',
    })
  })
  it('Spend Flow', () => {
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <FiatExchangeCurrency {...mockScreenProps(FiatExchangeFlow.Spend)} />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchFiatConnectProviders()])
    expect(tree.getByTestId('radio/CELO')).toBeDisabled()

    fireEvent.press(tree.getByTestId('radio/cEUR'))
    fireEvent.press(tree.getByText('next'))
    expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, {
      currency: 'cEUR',
    })
  })
})
