import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DappShortcutTransactionRequest from 'src/dapps/DappShortcutTransactionRequest'
import { RawShortcutTransaction, denyExecuteShortcut, executeShortcut } from 'src/positions/slice'
import { ShortcutStatus } from 'src/positions/types'
import { NetworkId } from 'src/transactions/types'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCeloTokenBalance, mockPositions, mockShortcuts } from 'test/values'
import { parseGwei } from 'viem'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))

jest.mock('src/viem/prepareTransactions')

const rewardId = 'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615'

function getMockStoreWithShortcutStatus(
  status: ShortcutStatus,
  transactions: RawShortcutTransaction[]
) {
  return createMockStore({
    positions: {
      positions: mockPositions,
      shortcuts: mockShortcuts,
      triggeredShortcutsStatus: {
        [rewardId]: {
          status,
          transactions,
          appName: 'some app name',
          appImage: 'https://some.app/image.png',
        },
      },
    },
  })
}

describe('DappShortcutTransactionRequest', () => {
  const transactions = [
    {
      from: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      networkId: NetworkId['celo-alfajores'],
      data: '0x3d18b912',
      to: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
    } as const,
  ]
  const gas = BigInt(100_000)
  const maxFeePerGas = parseGwei('5')
  const _baseFeePerGas = parseGwei('1')

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prepareTransactions).mockImplementation(async ({ baseTransactions }) => ({
      transactions: baseTransactions.map((tx) => ({
        ...tx,
        gas,
        maxFeePerGas,
        _baseFeePerGas,
      })),
      type: 'possible' as const,
      feeCurrency: mockCeloTokenBalance,
    }))
  })

  it('should a loader when the shortcut transaction has not been fetched yet', async () => {
    const { queryByText, getByTestId } = render(
      <Provider store={getMockStoreWithShortcutStatus('loading', [])}>
        <MockedNavigator component={DappShortcutTransactionRequest} params={{ rewardId }} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('DappShortcutTransactionRequest/Loading')).toBeTruthy())
    expect(queryByText('confirmTransaction')).toBeFalsy()
  })

  it('should display a dismiss-only bottom sheet if the user has insufficient gas funds', async () => {
    const store = getMockStoreWithShortcutStatus('pendingAccept', transactions)
    jest.mocked(prepareTransactions).mockImplementation(async ({ baseTransactions }) => ({
      type: 'not-enough-balance-for-gas' as const,
      feeCurrencies: [mockCeloTokenBalance],
    }))
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={DappShortcutTransactionRequest} params={{ rewardId }} />
      </Provider>
    )

    await waitFor(() =>
      expect(getByText('walletConnectRequest.notEnoughBalanceForGas.title')).toBeTruthy()
    )
    expect(
      getByText(
        'walletConnectRequest.notEnoughBalanceForGas.description, {"feeCurrencies":"CELO, cEUR, cUSD"}'
      )
    ).toBeTruthy()
    expect(queryByText('allow')).toBeFalsy()

    fireEvent.press(getByText('dismiss'))
    expect(store.getActions()).toEqual([denyExecuteShortcut(rewardId)])
  })

  it("should display a dismiss-only bottom sheet if the transaction couldn't be prepared", async () => {
    const store = getMockStoreWithShortcutStatus('pendingAccept', transactions)
    jest.mocked(prepareTransactions).mockRejectedValue(new Error('some error'))
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={DappShortcutTransactionRequest} params={{ rewardId }} />
      </Provider>
    )

    await waitFor(() =>
      expect(getByText('walletConnectRequest.failedToPrepareTransaction.title')).toBeTruthy()
    )
    expect(
      getByText(
        'walletConnectRequest.failedToPrepareTransaction.description, {"errorMessage":"some error"}'
      )
    ).toBeTruthy()
    expect(queryByText('allow')).toBeFalsy()

    fireEvent.press(getByText('dismiss'))
    expect(store.getActions()).toEqual([denyExecuteShortcut(rewardId)])
  })

  it('should accept the transaction request and handle dismiss the bottom sheet', async () => {
    const store = getMockStoreWithShortcutStatus('pendingAccept', transactions)
    const { getByText, queryByTestId, getByTestId, unmount } = render(
      <Provider store={store}>
        <MockedNavigator component={DappShortcutTransactionRequest} params={{ rewardId }} />
      </Provider>
    )

    await waitFor(() => expect(queryByTestId('EstimatedNetworkFee/Loading')).toBeFalsy())
    expect(queryByTestId('DappShortcutTransactionRequest/Loading')).toBeFalsy()

    expect(getByText('confirmTransaction')).toBeTruthy()

    const expectedPreparedTransactions = getSerializablePreparedTransactions(
      transactions.map((tx) => ({
        from: tx.from,
        to: tx.to,
        value: undefined,
        data: tx.data,
        gas,
        maxFeePerGas,
        _baseFeePerGas,
        _estimatedGasUse: undefined,
      }))
    )
    expect(getByTestId('DappShortcutTransactionRequest/RewardTransactionData')).toHaveTextContent(
      JSON.stringify(expectedPreparedTransactions)
    )

    fireEvent.press(getByText('allow'))

    expect(store.getActions()).toStrictEqual([
      executeShortcut({ id: rewardId, preparedTransactions: expectedPreparedTransactions }),
    ])

    store.clearActions()
    unmount()

    // should not deny the transaction on dismiss bottom sheet if transaction is approved
    expect(store.getActions()).toStrictEqual([])
  })

  it('should deny the transaction request on dismiss bottom sheet', async () => {
    const store = getMockStoreWithShortcutStatus('pendingAccept', transactions)
    const { unmount } = render(
      <Provider store={store}>
        <MockedNavigator component={DappShortcutTransactionRequest} params={{ rewardId }} />
      </Provider>
    )

    await act(() => {
      unmount()
    })

    expect(store.getActions()).toEqual([denyExecuteShortcut(rewardId)])
  })
})
