import React, { useMemo } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import TextButton from 'src/components/TextButton'
import ProgressArrow from 'src/icons/ProgressArrow'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import ExchangeFeedItem from 'src/transactions/feed/ExchangeFeedItem'
import { useFetchTransactions } from 'src/transactions/feed/queryHelper'
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

function TransactionFeed() {
  const {
    loading,
    error,
    transactions,
    fetchingMoreTransactions,
    fetchMoreTransactions,
  } = useFetchTransactions()

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

  function renderSectionHeader(item: any) {
    return <SectionHead text={item.section.title} right={renderSectionFilterButton(item)} />
  }

  function renderSectionFilterButton(item: any) {
    return (
      <TextButton
        hitSlop={variables.iconHitslop}
        style={styles.trxFilterBtn}
        onPress={() => navigate(Screens.TransactionHistoryFiltered, { month: item.section.month })}
        children={<ProgressArrow color={Colors.greenUI} />}
      />
    )
  }

  return (
    <>
      <SectionList
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
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
  trxFilterBtn: {
    ...fontStyles.small400,
    color: Colors.greenUI,
  },
})

export default TransactionFeed
