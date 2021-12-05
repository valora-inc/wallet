import SectionHead from '@celo/react-components/components/SectionHead'
import { toChecksumAddress } from '@celo/utils/lib/address'
import React, { useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { SectionList, View } from 'react-native'
import { useDispatch } from 'react-redux'
import config from 'src/geth/networkConfig'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import { updateTransactions } from 'src/transactions/actions'
import { TRANSACTIONS_QUERY } from 'src/transactions/feed/query'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { transactionsSelector } from 'src/transactions/reducer'
import { FeedType } from 'src/transactions/TransactionFeed'
import { TokenTransaction } from 'src/transactions/types'
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

function useQueryTransactionFeed() {
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const dispatch = useDispatch()

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  // TODO: Extract this to a more generic function/hook so that it can be reused
  const { loading, error, result } = useAsync(async () => {
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
  }, [counter])

  if (result?.errors) {
    Logger.warn(
      TAG,
      `Found errors when querying the transaction feed: ${JSON.stringify(result.errors)}`
    )
  }

  useEffect(() => {
    if (result?.data?.tokenTransactionsV2.transactions.length) {
      dispatch(updateTransactions(result.data.tokenTransactionsV2.transactions))
    }
  }, [result?.data])

  return { loading, error, transactions: result?.data?.tokenTransactionsV2.transactions }
}

function TransactionFeed() {
  const tokensInfo = useSelector(tokensByAddressSelector)
  const cachedTransactions = useSelector(transactionsSelector)

  const { loading, error, transactions } = useQueryTransactionFeed()
  const tokenTransactions: TokenTransaction[] = transactions ?? cachedTransactions

  const sections = useMemo(() => {
    if (tokenTransactions.length === 0) {
      return []
    }

    return groupFeedItemsInSections(tokenTransactions)
  }, [tokenTransactions])

  if (!tokenTransactions.length) {
    return <NoActivity kind={FeedType.HOME} loading={loading} error={error} />
  }

  function renderItem({ item: tx }: { item: TokenTransaction; index: number }) {
    switch (tx.__typename) {
      case 'TokenExchangeV2':
        // TODO
        return <View key={tx.transactionHash} />
      case 'TokenTransferV2':
        // TODO: We should standarize this. The tokens in Firebase are usually
        // (not always for some reason) in the checksum format (with some capital
        // letters) but they come in all lowercase from blockchain-api.
        if (
          !tokensInfo[toChecksumAddress(tx.amount.tokenAddress)] &&
          !tokensInfo[tx.amount.tokenAddress]
        ) {
          Logger.warn(TAG, `No token info found for address ${tx.amount.tokenAddress}`)
          return null
        }
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
