import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import FiatExchangeCurrency from 'src/fiatExchanges/FiatExchangeCurrency'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Network, NetworkId } from 'src/transactions/types'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { FiatExchangeFlow } from './utils'
import { mockCusdTokenId, mockCeurTokenId, mockCeloTokenId, mockEthTokenId } from 'test/values'
import { getDynamicConfigParams } from 'src/statsig'

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
      currency: 'cUSD',
      tokenId: mockCusdTokenId,
      flow: FiatExchangeFlow.CashIn,
      network: Network.Celo,
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
      currency: 'cEUR',
      tokenId: mockCeurTokenId,
      flow: FiatExchangeFlow.CashIn,
      network: Network.Celo,
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
      currency: 'CELO',
      flow: FiatExchangeFlow.CashIn,
      network: Network.Celo,
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
      currency: 'ETH',
      flow: FiatExchangeFlow.CashIn,
      network: Network.Ethereum,
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
