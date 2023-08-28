import { act, fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DappShortcutTransactionRequest from 'src/dapps/DappShortcutTransactionRequest'
import { RawShortcutTransaction } from 'src/positions/slice'
import { ShortcutStatus } from 'src/positions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))

const getMockStoreWithShortcutStatus = (
  status: ShortcutStatus,
  transactions: RawShortcutTransaction[]
) => {
  return createMockStore({
    positions: {
      positions: mockPositions,
      shortcuts: mockShortcuts,
      triggeredShortcutsStatus: {
        'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615': {
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
  const mockTransactions = [
    {
      from: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      network: 'celo',
      data: '0x3d18b912',
      to: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should a loader when the shortcut transaction has not been fetched yet', () => {
    const { queryByText, getByTestId } = render(
      <Provider store={getMockStoreWithShortcutStatus('loading', [])}>
        <MockedNavigator
          component={DappShortcutTransactionRequest}
          params={{
            rewardId:
              'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615',
          }}
        />
      </Provider>
    )

    expect(queryByText('confirmTransaction')).toBeFalsy()
    expect(getByTestId('DappShortcutTransactionRequest/Loading')).toBeTruthy()
  })

  it('should accept the transaction request and handle dismiss the bottom sheet', async () => {
    const mockStore = getMockStoreWithShortcutStatus('pendingAccept', mockTransactions)
    const { getByText, queryByTestId, getByTestId, unmount } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={DappShortcutTransactionRequest}
          params={{
            rewardId:
              'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615',
          }}
        />
      </Provider>
    )

    expect(queryByTestId('DappShortcutTransactionRequest/Loading')).toBeFalsy()

    expect(getByText('confirmTransaction')).toBeTruthy()
    expect(getByText('confirmTransaction')).toBeTruthy()
    expect(getByTestId('DappShortcutTransactionRequest/RewardTransactionData')).toHaveTextContent(
      JSON.stringify(mockTransactions)
    )

    fireEvent.press(getByText('allow'))

    expect(mockStore.getActions()).toMatchInlineSnapshot(`
      [
        {
          "payload": "claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615",
          "type": "positions/executeShortcut",
        },
      ]
    `)

    mockStore.clearActions()
    unmount()

    // should not deny the transaction on dismiss bottom sheet if transaction is approved
    expect(mockStore.getActions()).toMatchInlineSnapshot(`[]`)
  })

  it('should deny the transaction request on dismiss bottom sheet', async () => {
    const store = getMockStoreWithShortcutStatus('pendingAccept', mockTransactions)
    const { unmount } = render(
      <Provider store={store}>
        <MockedNavigator
          component={DappShortcutTransactionRequest}
          params={{
            rewardId:
              'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615',
          }}
        />
      </Provider>
    )

    await act(() => {
      unmount()
    })

    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
          "payload": "claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615",
          "type": "positions/denyExecuteShortcut",
        },
      ]
    `)
  })
})
