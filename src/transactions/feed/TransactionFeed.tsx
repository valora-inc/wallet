import React, { useMemo } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import NoActivity from 'src/transactions/NoActivity'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import {
  deduplicateTransactions,
  getAllowedNetworkIds,
  useFetchTransactions,
} from 'src/transactions/feed/queryHelper'
import {
  completedStandbyTransactionsSelector,
  pendingStandbyTransactionsSelector,
  transactionsSelector,
} from 'src/transactions/reducer'
import { TokenTransaction, TransactionStatus } from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'

export type FeedTokenProperties = {
  status: TransactionStatus // for standby transactions
}

export type FeedTokenTransaction = TokenTransaction & FeedTokenProperties

function TransactionFeed() {
  const { loading, error, transactions, fetchingMoreTransactions, fetchMoreTransactions } =
    useFetchTransactions()

  const cachedTransactions = useSelector(transactionsSelector)
  const allPendingTransactions = useSelector(pendingStandbyTransactionsSelector)
  const allConfirmedStandbyTransactions = useSelector(completedStandbyTransactionsSelector)
  const allowedNetworks = getAllowedNetworkIds()

  const confirmedFeedTransactions = useMemo(() => {
    const confirmedTokenTransactions: TokenTransaction[] =
      transactions.length > 0 ? transactions : cachedTransactions
    const allConfirmedTransactions = deduplicateTransactions(
      confirmedTokenTransactions,
      allConfirmedStandbyTransactions
    )
    return allConfirmedTransactions.filter((tx) => {
      return allowedNetworks.includes(tx.networkId)
    })
  }, [transactions, cachedTransactions, allowedNetworks, allConfirmedStandbyTransactions])

  const pendingTransactions = useMemo(() => {
    return allPendingTransactions.filter((tx) => {
      return allowedNetworks.includes(tx.networkId)
    })
  }, [allPendingTransactions, allowedNetworks])

  const sections = useMemo(() => {
    if (confirmedFeedTransactions.length === 0 && pendingTransactions.length === 0) {
      return []
    }

    return groupFeedItemsInSections(pendingTransactions, confirmedFeedTransactions)
  }, [pendingTransactions, confirmedFeedTransactions])

  if (!sections.length) {
    return <NoActivity loading={loading} error={error} />
  }

  function renderItem({ item: tx }: { item: FeedTokenTransaction; index: number }) {
    switch (tx.__typename) {
      case 'TokenExchangeV3':
        return <SwapFeedItem key={tx.transactionHash} exchange={tx} />
      case 'TokenTransferV3':
        return <TransferFeedItem key={tx.transactionHash} transfer={tx} />
      case 'NftTransferV3':
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
