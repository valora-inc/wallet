import SectionHead from '@celo/react-components/components/SectionHead'
import colors from '@celo/react-components/styles/colors'
import { Spacing } from '@celo/react-components/styles/styles'
import * as Sentry from '@sentry/react-native'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'
import useInterval from 'src/hooks/useInterval'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { updateTransactions } from 'src/transactions/actions'
import ExchangeFeedItem from 'src/transactions/feed/ExchangeFeedItem'
import { useAsyncQueryTransactionsFeed } from 'src/transactions/feed/queryHelper'
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

export interface PageInfo {
  startCursor: string
  endCursor: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}
interface TransactionFeed {
  tokenTransactionsV2: {
    __typename: 'TokenTransactionsV2'
    transactions: TokenTransaction[]
    pageInfo: PageInfo
  }
}

export type FeedTokenProperties = {
  status: TransactionStatus // for standby transactions
}

export type FeedTokenTransaction = TokenTransaction & FeedTokenProperties

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

function addFetchedTransactionFunction(
  fetchedTransactions: TokenTransaction[],
  setFetchedTransactions: any
) {
  return (transactions: TokenTransaction[]) => {
    const currentHashes = new Set(fetchedTransactions.map((tx) => tx.transactionHash))

    const transactionsWithoutDuplicatedHash = fetchedTransactions.concat(
      transactions.filter((tx) => !currentHashes.has(tx.transactionHash))
    )

    transactionsWithoutDuplicatedHash.sort((a, b) => {
      return b.timestamp - a.timestamp
    })

    setFetchedTransactions(transactionsWithoutDuplicatedHash)
  }
}

function TransactionFeed() {
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)

  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [fetchMoreTransactions, setFetchMoreTransactions] = useState(false)

  const cachedTransactions = useSelector(transactionsSelector)
  const [fetchedTransactions, setFetchedTransactions] = useState<TokenTransaction[]>([])
  const addFetchedTransactions = addFetchedTransactionFunction(
    fetchedTransactions,
    setFetchedTransactions
  )

  const dispatch = useDispatch()

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)

  const { loading, error } = useAsyncQueryTransactionsFeed({
    address,
    localCurrencyCode,
    dependencies: [counter],
    onSuccess: (result) => {
      if (result?.data?.tokenTransactionsV2?.transactions.length) {
        addFetchedTransactions(result.data.tokenTransactionsV2.transactions)
        dispatch(updateTransactions(result.data.tokenTransactionsV2.transactions))
      }
      if (!pageInfo) {
        setPageInfo(result?.data?.tokenTransactionsV2?.pageInfo)
      }
      if (result?.errors) {
        Sentry.captureException(result.errors)
        Logger.warn(
          TAG,
          ` Found errors when querying for new transactions in feed: ${JSON.stringify(
            result.errors
          )}`
        )
      }
    },
    onError: (error) => {
      Sentry.captureException(error)
      Logger.warn(TAG, ` Found errors when querying for new transactions in feed: ${error.message}`)
    },
  })

  useAsyncQueryTransactionsFeed({
    address,
    localCurrencyCode,
    afterCursor: pageInfo?.endCursor,
    dependencies: [counter, fetchMoreTransactions, pageInfo?.endCursor],
    precondition: () => {
      return fetchMoreTransactions && !!pageInfo && pageInfo?.hasNextPage
    },
    onSuccess: (result) => {
      // TODO: Show a message if we know there aren't more transactions
      setFetchMoreTransactions(false)

      if (result) {
        if (result?.data?.tokenTransactionsV2?.transactions.length) {
          addFetchedTransactions(result.data.tokenTransactionsV2.transactions)
        }

        setPageInfo(result?.data?.tokenTransactionsV2?.pageInfo)
      }
    },
    onError: (error) => {
      // TODO: show a message indicating there was an error
      setFetchMoreTransactions(false)
      Sentry.captureException(error)
      Logger.warn(
        TAG,
        `Found errors when querying the paginated transaction feed: ${error.message}`
      )
    },
  })

  const confirmedTokenTransactions: TokenTransaction[] =
    fetchedTransactions.length > 0 ? fetchedTransactions : cachedTransactions
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
    <>
      <SectionList
        renderItem={renderItem}
        renderSectionHeader={(item) => <SectionHead text={item.section.title} />}
        sections={sections}
        keyExtractor={(item) => `${item.transactionHash}-${item.timestamp.toString()}`}
        keyboardShouldPersistTaps="always"
        testID="TransactionList"
        onEndReached={() => setFetchMoreTransactions(true)}
      />
      {fetchMoreTransactions && (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            style={styles.loadingIcon}
            size="large"
            color={colors.greenBrand}
            testID="DAppExplorerScreen/loading"
          />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  loadingIcon: {
    marginVertical: Spacing.Thick24,
    height: 108,
    width: 108,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
})

export default TransactionFeed
