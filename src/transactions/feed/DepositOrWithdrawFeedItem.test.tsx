import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
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
    providerName: 'Test Provider',
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
    expect(
      getByText('transactionFeed.depositSubtitle, {"providerName":"Test Provider"}')
    ).toBeTruthy()
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
    expect(
      getByText('transactionFeed.withdrawSubtitle, {"providerName":"Test Provider"}')
    ).toBeTruthy()
    expect(getByTestId('DepositOrWithdrawFeedItem/WITHDRAW-amount-crypto')).toBeTruthy()
    expect(getByTestId('DepositOrWithdrawFeedItem/WITHDRAW-amount-local')).toBeTruthy()
  })

  it('displays provider name when available', () => {
    const { getByText } = render(
      <Provider store={store}>
        <DepositOrWithdrawFeedItem transaction={depositTransaction} />
      </Provider>
    )

    expect(
      getByText('transactionFeed.depositSubtitle, {"providerName":"Test Provider"}')
    ).toBeTruthy()
  })

  it('does not display provider name when not available', () => {
    const transactionWithoutProvider = {
      ...depositTransaction,
      providerName: undefined,
    }

    const { queryByText } = render(
      <Provider store={store}>
        <DepositOrWithdrawFeedItem transaction={transactionWithoutProvider} />
      </Provider>
    )

    expect(
      queryByText('transactionFeed.depositSubtitle, {"providerName":"Test Provider"}')
    ).toBeNull()
  })
})
