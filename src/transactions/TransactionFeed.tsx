import { ApolloError } from 'apollo-boost'
import gql from 'graphql-tag'
import React, { useMemo } from 'react'
import { SectionList, SectionListData } from 'react-native'
import { useSelector } from 'react-redux'
import { TransactionFeedFragment } from 'src/apollo/types'
import SectionHead from 'src/components/SectionHead'
import { RecipientInfo } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector, recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import NoActivity from 'src/transactions/NoActivity'
import { recentTxRecipientsCacheSelector } from 'src/transactions/reducer'
import TransferFeedItem from 'src/transactions/TransferFeedItem'
import { TransactionStatus } from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import Logger from 'src/utils/Logger'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionFeed'

export type FeedItem = TransactionFeedFragment & {
  status: TransactionStatus // for standby transactions
}

interface Props {
  loading: boolean
  error: ApolloError | undefined
  data: FeedItem[] | undefined
}

function TransactionFeed({ loading, error, data }: Props) {
  const commentKey = useSelector(dataEncryptionKeySelector)
  // Diego: I think we can remove these line because we already have that info in recipientInfo.
  const addressToE164Number = useSelector((state: RootState) => state.identity.addressToE164Number)
  const phoneRecipientCache = useSelector(phoneRecipientCacheSelector)
  const recentTxRecipientsCache = useSelector(recentTxRecipientsCacheSelector)

  const recipientInfo: RecipientInfo = useSelector(recipientInfoSelector)

  const renderItem = ({ item: tx }: { item: FeedItem; index: number }) => {
    switch (tx.__typename) {
      case 'TokenTransfer':
        return (
          <TransferFeedItem
            addressToE164Number={addressToE164Number}
            phoneRecipientCache={phoneRecipientCache}
            recentTxRecipientsCache={recentTxRecipientsCache}
            commentKey={commentKey}
            recipientInfo={recipientInfo}
            {...tx}
          />
        )
    }
  }

  const renderSectionHeader = (info: { section: SectionListData<FeedItem> }) => (
    <SectionHead text={info.section.title} />
  )

  const keyExtractor = (item: TransactionFeedFragment) => {
    return item.hash + item.timestamp.toString()
  }

  const sections = useMemo(() => {
    // Only compute sections for home screen.
    if (!data || data.length === 0) return []
    return groupFeedItemsInSections(data)
  }, [data])

  if (error) {
    // Log an error, but continue to show any events we have cached.
    Logger.error(TAG, 'Failure while loading transaction feed', error)
  }

  if (!data || data.length === 0) {
    return <NoActivity loading={loading} error={error} />
  }

  return (
    <SectionList
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      sections={sections}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="always"
      testID="TransactionList"
    />
  )
}

export const TransactionFeedFragments = {
  transaction: gql`
    fragment TransactionFeed on TokenTransaction {
      ...TransferItem
    }

    ${TransferFeedItem.fragments.transfer}
  `,
}

// TODO: Meassure performance of this screen and decide if we need to optimize the number of renders.
// Right now |data| always changes (returns a different ref) which causes many extra renders.
export default TransactionFeed
