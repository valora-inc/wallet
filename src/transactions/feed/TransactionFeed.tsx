import React, { useMemo } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import { useFetchTransactions } from 'src/transactions/feed/queryHelper'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { standbyTransactionsSelector, transactionsSelector } from 'src/transactions/reducer'
import { StandbyTransaction, TokenTransaction, TransactionStatus } from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'

export type FeedTokenProperties = {
  status: TransactionStatus // for standby transactions
}

export type FeedTokenTransaction = TokenTransaction & FeedTokenProperties

function mapStandbyTransactionToFeedTokenTransaction(tx: StandbyTransaction): FeedTokenTransaction {
  const transferTx = tx as StandbyTransaction
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

function TransactionFeed() {
  const { loading, error, transactions, fetchingMoreTransactions, fetchMoreTransactions } =
    useFetchTransactions()

  const cachedTransactions = useSelector(transactionsSelector)

  const confirmedTokenTransactions: TokenTransaction[] =
    transactions.length > 0 ? transactions : cachedTransactions
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
  }, [tokenTransactions.map((tx) => tx.transactionHash).join(',')])

  if (!tokenTransactions.length) {
    return <NoActivity loading={loading} error={error} />
  }

  function renderItem({ item: tx }: { item: FeedTokenTransaction; index: number }) {
    switch (tx.__typename) {
      case 'TokenExchangeV2':
        return <SwapFeedItem key={tx.transactionHash} exchange={tx} />
      case 'TokenTransferV2':
        return <TransferFeedItem key={tx.transactionHash} transfer={tx} />
      case 'NftTransferV2':
        return <NftFeedItem key={tx.transactionHash} transaction={tx} />
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
        onEndReached={() => fetchMoreTransactions()}
      />
      {fetchingMoreTransactions && (
        <View style={styles.centerContainer}>
          <ActivityIndicator style={styles.loadingIcon} size="large" color={colors.greenBrand} />
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
