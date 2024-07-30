import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { NetworkId } from 'src/transactions/types'
import EstimatedNetworkFee from 'src/walletConnect/screens/EstimatedNetworkFee'
import { createMockStore } from 'test/utils'
import { parseGwei } from 'viem'

describe('EstimatedNetworkFee', () => {
  const mockTransaction = {
    from: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    networkId: NetworkId['celo-alfajores'],
    data: '0x3d18b912',
    to: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
    gas: '100000',
    maxFeePerGas: parseGwei('5').toString(),
    _baseFeePerGas: parseGwei('1').toString(),
  } as const

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the estimate network fee', () => {
    const store = createMockStore({})
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <EstimatedNetworkFee
          isLoading={false}
          networkId={NetworkId['celo-alfajores']}
          transactions={[mockTransaction]}
        />
      </Provider>
    )

    expect(
      getByText('walletConnectRequest.estimatedNetworkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()

    expect(getByTestId('EstimatedNetworkFee/Amount')).toHaveTextContent('0.0001 CELO') // gas * _baseFeePerGas
    expect(getByTestId('EstimatedNetworkFee/AmountLocal')).toHaveTextContent('₱0.00067')

    expect(queryByTestId('EstimatedNetworkFee/Loading')).toBeFalsy()
  })

  it("shows the loading state when the network fee hasn't been calculated yet", () => {
    const store = createMockStore({})
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <EstimatedNetworkFee
          isLoading={true}
          networkId={NetworkId['celo-alfajores']}
          transactions={[]}
        />
      </Provider>
    )

    expect(
      getByText('walletConnectRequest.estimatedNetworkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()

    expect(getByTestId('EstimatedNetworkFee/Loading')).toBeTruthy()
  })

  it("renders null when there isn't enough information to display the fee", () => {
    const store = createMockStore({})
    const { queryByTestId } = render(
      <Provider store={store}>
        <EstimatedNetworkFee
          isLoading={false}
          networkId={NetworkId['celo-alfajores']}
          transactions={[
            {
              ...mockTransaction,
              _baseFeePerGas: undefined, // This is the missing information
            },
          ]}
        />
      </Provider>
    )

    expect(queryByTestId('EstimatedNetworkFee')).toBeFalsy()
  })
})
