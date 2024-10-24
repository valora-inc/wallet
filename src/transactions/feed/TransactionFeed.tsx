import React, { useMemo } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import GetStarted from 'src/home/GetStarted'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import NoActivity from 'src/transactions/NoActivity'
import EarnFeedItem from 'src/transactions/feed/EarnFeedItem'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import {
  deduplicateTransactions,
  useAllowedNetworkIdsForTransfers,
  useFetchTransactions,
} from 'src/transactions/feed/queryHelper'
import {
  confirmedStandbyTransactionsSelector,
  pendingStandbyTransactionsSelector,
} from 'src/transactions/selectors'
import { TokenTransaction, TransactionStatus } from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'

function TransactionFeed() {
  const { loading, error, transactions, fetchingMoreTransactions, fetchMoreTransactions } =
    useFetchTransactions()

  const allPendingStandbyTransactions = useSelector(pendingStandbyTransactionsSelector)
  const allConfirmedStandbyTransactions = useSelector(confirmedStandbyTransactionsSelector)
  const allowedNetworks = useAllowedNetworkIdsForTransfers()

  const confirmedFeedTransactions = useMemo(() => {
    // Filter out received pending transactions that are also in the pending
    // standby array because those will be displayed with the pending
    // transactions
    const completedOrNotPendingStandbyTransactions = transactions.filter(
      (tx) =>
        tx.status === TransactionStatus.Complete ||
        !allPendingStandbyTransactions.find(
          (pendingStandbyTx) =>
            pendingStandbyTx.transactionHash === tx.transactionHash &&
            pendingStandbyTx.networkId === tx.networkId
        )
    )

    const allConfirmedTransactions = deduplicateTransactions(
      allConfirmedStandbyTransactions,
      completedOrNotPendingStandbyTransactions
    ).sort((a, b) => {
      const diff = b.timestamp - a.timestamp
      if (diff === 0) {
        // if the timestamps are the same, most likely one of the transactions
        // is an approval. on the feed we want to show the approval first.
        return a.__typename === 'TokenApproval' ? 1 : b.__typename === 'TokenApproval' ? -1 : 0
      }
      return diff
    })

    return allConfirmedTransactions.filter((tx) => {
      return allowedNetworks.includes(tx.networkId)
    })
  }, [
    transactions,
    allowedNetworks,
    allConfirmedStandbyTransactions,
    allPendingStandbyTransactions,
  ])

  const pendingTransactions = useMemo(() => {
    return allPendingStandbyTransactions.filter((tx) => {
      return allowedNetworks.includes(tx.networkId)
    })
  }, [allPendingStandbyTransactions, allowedNetworks])

  const sections = useMemo(() => {
    if (confirmedFeedTransactions.length === 0 && pendingTransactions.length === 0) {
      return []
    }

    const confirmedFeedTxHashes = new Set(confirmedFeedTransactions.map((tx) => tx.transactionHash))
    return groupFeedItemsInSections(
      pendingTransactions.filter((tx) => !confirmedFeedTxHashes.has(tx.transactionHash)),
      confirmedFeedTransactions
    )
  }, [pendingTransactions, confirmedFeedTransactions])

  if (!sections.length) {
    return getFeatureGate(StatsigFeatureGates.SHOW_GET_STARTED) ? (
      <GetStarted />
    ) : (
      <NoActivity loading={loading} error={error} />
    )
  }

  function renderItem({ item: tx }: { item: TokenTransaction; index: number }) {
    switch (tx.__typename) {
      case 'TokenExchangeV3':
      case 'CrossChainTokenExchange':
        return <SwapFeedItem key={tx.transactionHash} transaction={tx} />
      case 'TokenTransferV3':
        return <TransferFeedItem key={tx.transactionHash} transfer={tx} />
      case 'NftTransferV3':
        return <NftFeedItem key={tx.transactionHash} transaction={tx} />
      case 'TokenApproval':
        return <TokenApprovalFeedItem key={tx.transactionHash} transaction={tx} />
      case 'EarnDeposit':
      case 'EarnSwapDeposit':
      case 'EarnWithdraw':
      case 'EarnClaimReward':
        return <EarnFeedItem key={tx.transactionHash} transaction={tx} />
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
          <ActivityIndicator style={styles.loadingIcon} size="large" color={colors.accent} />
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
