import { map } from 'lodash'
import React, { Dispatch, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import LineItemRow from 'src/components/LineItemRow'
import SectionHead from 'src/components/SectionHead'
import variables from 'src/styles/variables'
import ExchangeFeedItem from 'src/transactions/feed/ExchangeFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { transactionsSelector } from 'src/transactions/reducer'
import { FeedType } from 'src/transactions/TransactionFeed'
import { TokenTransaction, TransactionStatus } from 'src/transactions/types'
import {
  calculateTransactionSubtotal,
  filterTxByAmount,
  filterTxByMonth,
  filterTxByRecipient,
  groupFeedItemsInSections,
} from 'src/transactions/utils'

export type FeedTokenProperties = {
  status: TransactionStatus // for standby transactions
}

export type FeedTokenTransaction = TokenTransaction & FeedTokenProperties

type Props = {
  month?: string
  minAmount?: number
  maxAmount?: number
  recipient?: string
  generate: Dispatch<any>
}

const StaticTransactionFeed = ({
  month: month,
  minAmount: min,
  maxAmount: max,
  recipient: recipient,
  generate,
}: Props) => {
  const { t } = useTranslation()
  const cachedTransactions = useSelector(transactionsSelector)

  const confirmedTransactions = map(
    cachedTransactions,
    (tx: TokenTransaction): FeedTokenTransaction => ({
      ...tx,
      status: TransactionStatus.Complete,
    })
  )

  let result = filterTxByMonth(confirmedTransactions, month)
  result = filterTxByAmount(result, min, max)
  result = filterTxByRecipient(result, recipient)
  const subtotal = calculateTransactionSubtotal(result)
  const grouped = groupFeedItemsInSections(result)
  const [total, sections] = [subtotal, grouped]

  useEffect(() => {
    generate(result)
  }, [])

  function renderItem({ item: tx }: { item: FeedTokenTransaction; index: number }) {
    switch (tx.__typename) {
      case 'TokenExchangeV2':
        return <ExchangeFeedItem key={tx.transactionHash} exchange={tx} />
      case 'TokenTransferV2':
        return <TransferFeedItem key={tx.transactionHash} transfer={tx} />
    }
  }

  function renderSectionHeader(item: any) {
    return <SectionHead text={item.section.title} />
  }

  if (!cachedTransactions.length) {
    return <NoActivity kind={FeedType.HOME} loading={false} error={undefined} />
  }

  return (
    <>
      <SectionList
        style={styles.transactionContainer}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        keyExtractor={(item) => `${item.transactionHash}-${item.timestamp.toString()}`}
        keyboardShouldPersistTaps="always"
        testID="TransactionListFiltered"
      />
      <LineItemRow style={styles.total} title={t('total')} amount={total} />
    </>
  )
}

const styles = StyleSheet.create({
  transactionContainer: {},
  total: {
    paddingHorizontal: variables.contentPadding,
  },
})

export default StaticTransactionFeed
