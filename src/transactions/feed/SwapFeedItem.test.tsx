import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import {
  NetworkId,
  TokenExchange,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockCeurTokenId, mockCusdTokenId, mockEthTokenId, mockTokenBalances } from 'test/values'

const MOCK_TX_HASH = '0x006b866d20452a24d1d90c7514422188cc7c5d873e2f1ed661ec3f810ad5331c'

const swapTransaction: TokenExchange = {
  networkId: NetworkId['celo-alfajores'],
  type: TokenTransactionTypeV2.SwapTransaction,
  transactionHash: MOCK_TX_HASH,
  timestamp: 1234,
  block: '2345',
  inAmount: {
    tokenId: mockCeurTokenId,
    value: '2.93',
  },
  outAmount: {
    tokenId: mockCusdTokenId,
    value: '2.87',
  },
  fees: [],
  status: TransactionStatus.Complete,
}

const crossChainSwapTransaction: TokenExchange = {
  ...swapTransaction,
  type: TokenTransactionTypeV2.CrossChainSwapTransaction,
  inAmount: {
    tokenId: mockEthTokenId,
    value: '0.000002',
  },
}

describe('SwapFeedItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly for completed same-chain swap from cUSD to cEUR', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapFeedItem transaction={swapTransaction} />
      </Provider>
    )

    expect(getByTestId('SwapFeedItem/title')).toHaveTextContent('swapScreen.title')
    expect(getByTestId('SwapFeedItem/subtitle')).toHaveTextContent(
      'feedItemSwapPath, {"token1":"cUSD","token2":"cEUR"}'
    )
    expect(getByTestId('SwapFeedItem/incomingAmount')).toHaveTextContent('+2.93 cEUR')
    expect(getByTestId('SwapFeedItem/outgoingAmount')).toHaveTextContent('-2.87 cUSD')

    fireEvent.press(getByTestId('SwapFeedItem'))
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, {
      transaction: swapTransaction,
    })
  })

  it('renders correctly for completed cross-chain swap from cUSD to ETH', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        })}
      >
        <SwapFeedItem transaction={crossChainSwapTransaction} />
      </Provider>
    )

    expect(getByTestId('SwapFeedItem/title')).toHaveTextContent('swapScreen.title')
    expect(getByTestId('SwapFeedItem/subtitle')).toHaveTextContent(
      'transactionFeed.crossChainSwapTransactionLabel'
    )
    expect(getByTestId('SwapFeedItem/incomingAmount')).toHaveTextContent('+0.000002 ETH')
    expect(getByTestId('SwapFeedItem/outgoingAmount')).toHaveTextContent('-2.87 cUSD')

    fireEvent.press(getByTestId('SwapFeedItem'))
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, {
      transaction: crossChainSwapTransaction,
    })
  })

  it('renders correctly for pending cross-chain swap with no inAmount value', async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapFeedItem
          transaction={{
            ...crossChainSwapTransaction,
            status: TransactionStatus.Pending,
            inAmount: {
              tokenId: mockEthTokenId,
              value: '', // this value can be empty for pending cross-chain swaps that don't have a corresponding standby transaction, e.g. a restoring user
            },
          }}
        />
      </Provider>
    )

    expect(getByTestId('SwapFeedItem/title')).toHaveTextContent('swapScreen.title')
    expect(getByTestId('SwapFeedItem/subtitle')).toHaveTextContent(
      'transactionFeed.crossChainSwapTransactionLabel'
    )
    expect(queryByTestId('SwapFeedItem/incomingAmount')).toBeFalsy()
    expect(getByTestId('SwapFeedItem/outgoingAmount')).toHaveTextContent('-2.87 cUSD')
  })
})
