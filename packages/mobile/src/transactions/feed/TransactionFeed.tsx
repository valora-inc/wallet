import * as Sentry from '@sentry/react-native'
import React, { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { SectionList } from 'react-native'
import { useDispatch } from 'react-redux'
import SectionHead from 'src/components/SectionHead'
import config from 'src/geth/networkConfig'
import useInterval from 'src/hooks/useInterval'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { updateTransactions } from 'src/transactions/actions'
import ExchangeFeedItem from 'src/transactions/feed/ExchangeFeedItem'
import { TRANSACTIONS_QUERY } from 'src/transactions/feed/query'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { standbyTransactionsSelector, transactionsSelector } from 'src/transactions/reducer'
import { FeedType } from 'src/transactions/TransactionFeed'
import {
  ExchangeStandby,
  StandbyTransaction,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
  TransferStandby,
} from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionFeed'
// Query poll interval
export const POLL_INTERVAL = 10000 // 10 secs

interface TransactionFeed {
  tokenTransactionsV2: {
    __typename: 'TokenTransactionsV2'
    transactions: TokenTransaction[]
  }
}

export type FeedTokenProperties = {
  status: TransactionStatus // for standby transactions
}

export type FeedTokenTransaction = TokenTransaction & FeedTokenProperties

function useQueryTransactionFeed() {
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const dispatch = useDispatch()

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)

  // TODO: Extract this to a more generic function/hook so that it can be reused
  const { loading, error, result } = useAsync(
    async () => {
      const response = await fetch(`${config.blockchainApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: TRANSACTIONS_QUERY,
          variables: { address, localCurrencyCode },
        }),
      })
      return response.json()
    },
    [counter],
    {
      onSuccess: (result) => {
        if (result?.data?.tokenTransactionsV2?.transactions.length) {
          dispatch(updateTransactions(result.data.tokenTransactionsV2.transactions))
        }
        if (result?.errors) {
          Sentry.captureException(result.errors)
          Logger.warn(
            TAG,
            `Found errors when querying the transaction feed: ${JSON.stringify(result.errors)}`
          )
        }
      },
    }
  )

  return { loading, error, transactions: result?.data?.tokenTransactionsV2?.transactions }
}

function mapStandbyTransactionToFeedTokenTransaction(tx: StandbyTransaction): FeedTokenTransaction {
  switch (tx.type) {
    case TokenTransactionTypeV2.Exchange:
      const exchangeTx = tx as ExchangeStandby
      return {
        __typename: 'TokenExchangeV2',
        type: tx.type,
        status: tx.status,
        transactionHash: tx.hash || '',
        timestamp: tx.timestamp,
        block: '',
        inAmount: {
          value: exchangeTx.inValue,
          tokenAddress: exchangeTx.inTokenAddress,
        },
        outAmount: {
          value: exchangeTx.outValue,
          tokenAddress: exchangeTx.outTokenAddress,
        },
        metadata: {},
        fees: [],
      }
    default:
      const transferTx = tx as TransferStandby
      return {
        __typename: 'TokenTransferV2',
        type: tx.type,
        status: tx.status,
        transactionHash: tx.hash || '',
        timestamp: tx.timestamp,
        block: '',
        address: transferTx.address,
        amount: {
          value: transferTx.value,
          tokenAddress: transferTx.tokenAddress,
        },
        metadata: {},
        fees: [],
      }
  }
}

function TransactionFeed() {
  const cachedTransactions = useSelector(transactionsSelector)

  const { loading, error, transactions } = useQueryTransactionFeed()
  const confirmedTokenTransactions: TokenTransaction[] = transactions ?? cachedTransactions
  const confirmedFeedTransactions = confirmedTokenTransactions.map((tx) => ({
    ...tx,
    status: TransactionStatus.Complete,
  }))

  const standbyFeedTransactions = useSelector(standbyTransactionsSelector).map((tx) =>
    mapStandbyTransactionToFeedTokenTransaction(tx)
  )

  const tokenTransactions = [...standbyFeedTransactions, ...confirmedFeedTransactions]

  const sections = useMemo(() => {
    if (tokenTransactions.length === 0) {
      return []
    }

    return groupFeedItemsInSections(tokenTransactions)
  }, [tokenTransactions])

  if (!tokenTransactions.length) {
    return <NoActivity kind={FeedType.HOME} loading={loading} error={error} />
  }

  function renderItem({ item: tx }: { item: FeedTokenTransaction; index: number }) {
    switch (tx.__typename) {
      case 'TokenExchangeV2':
        return <ExchangeFeedItem key={tx.transactionHash} exchange={tx} />
      case 'TokenTransferV2':
        return <TransferFeedItem key={tx.transactionHash} transfer={tx} />
    }
  }

  return (
    <SectionList
      renderItem={renderItem}
      renderSectionHeader={(item) => <SectionHead text={item.section.title} />}
      sections={sections}
      keyExtractor={(item) => `${item.transactionHash}-${item.timestamp.toString()}`}
      keyboardShouldPersistTaps="always"
      testID="TransactionList"
    />
  )
}

export default TransactionFeed
