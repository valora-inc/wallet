import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import DepositOrWithdrawFeedItem from 'src/transactions/feed/DepositOrWithdrawFeedItem'
import { NetworkId, TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId, mockCusdTokenId } from 'test/values'

describe('DepositOrWithdrawFeedItem', () => {
  const store = createMockStore()

  const depositTransaction = {
    type: TokenTransactionTypeV2.Deposit as const,
    networkId: NetworkId['celo-mainnet'],
    timestamp: 1234567890,
    block: '123456',
    transactionHash: '0x123',
    fees: [],
    appName: 'Some Dapp',
    inAmount: {
      value: '100',
      tokenId: mockCeloTokenId,
    },
    outAmount: {
      value: '100',
      tokenId: mockCusdTokenId,
    },
    status: TransactionStatus.Complete,
  }

  const withdrawTransaction = {
    ...depositTransaction,
    type: TokenTransactionTypeV2.Withdraw as const,
  }

  it('renders deposit correctly', () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <DepositOrWithdrawFeedItem transaction={depositTransaction} />
      </Provider>
    )

    expect(getByText('transactionFeed.depositTitle')).toBeTruthy()
    expect(getByText('transactionFeed.depositSubtitle, {"txAppName":"Some Dapp"}')).toBeTruthy()
    expect(getByTestId('DepositOrWithdrawFeedItem/DEPOSIT-amount-crypto')).toBeTruthy()
    expect(getByTestId('DepositOrWithdrawFeedItem/DEPOSIT-amount-local')).toBeTruthy()
  })

  it('renders withdraw correctly', () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <DepositOrWithdrawFeedItem transaction={withdrawTransaction} />
      </Provider>
    )

    expect(getByText('transactionFeed.withdrawTitle')).toBeTruthy()
    expect(getByText('transactionFeed.withdrawSubtitle, {"txAppName":"Some Dapp"}')).toBeTruthy()
    expect(getByTestId('DepositOrWithdrawFeedItem/WITHDRAW-amount-crypto')).toBeTruthy()
    expect(getByTestId('DepositOrWithdrawFeedItem/WITHDRAW-amount-local')).toBeTruthy()
  })

  it('displays app name when available', () => {
    const { getByText } = render(
      <Provider store={store}>
        <DepositOrWithdrawFeedItem transaction={depositTransaction} />
      </Provider>
    )

    expect(getByText('transactionFeed.depositSubtitle, {"txAppName":"Some Dapp"}')).toBeTruthy()
  })

  it('displays when app name is not available', () => {
    const { queryByText } = render(
      <Provider store={store}>
        <DepositOrWithdrawFeedItem
          transaction={{
            ...depositTransaction,
            appName: undefined,
          }}
        />
      </Provider>
    )

    expect(queryByText('transactionFeed.depositSubtitle, {"context":"noTxAppName"}')).toBeTruthy()
  })

  it('should fire analytic event on tap', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <DepositOrWithdrawFeedItem transaction={depositTransaction} />
      </Provider>
    )

    fireEvent.press(getByTestId(`DepositOrWithdrawFeedItem/${depositTransaction.transactionHash}`))
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.transaction_feed_item_select, {
      itemType: depositTransaction.type,
    })
  })
})
