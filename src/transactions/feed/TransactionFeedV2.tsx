import type { Action } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery, skipToken } from '@reduxjs/toolkit/query/react'
import React from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import { REHYDRATE } from 'redux-persist'
import SectionHead from 'src/components/SectionHead'
import GetStarted from 'src/home/GetStarted'
import { useSelector } from 'src/redux/hooks'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/store'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import { getSupportedNetworkIdsForApprovalTxsInHomefeed } from 'src/tokens/utils'
import NoActivity from 'src/transactions/NoActivity'
import EarnFeedItem from 'src/transactions/feed/EarnFeedItem'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import { NetworkId, type TokenTransaction, TransactionStatus } from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import { walletAddressSelector } from 'src/web3/selectors'

type Response = {
  transactions: TokenTransaction[]
  pageInfo: {
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

function isHydrateAction(action: Action): action is Action<typeof REHYDRATE> & {
  key: string
  payload: RootState
  err: unknown
} {
  return action.type === REHYDRATE
}

export const transactionFeedV2Api = createApi({
  reducerPath: 'transactionFeedV2Api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/wallet/',
    headers: {
      Accept: 'application/json',
    },
  }),
  // keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    transactionFeedV2: builder.query<Response, string>({
      query: (address) => `${address}/transactions`,
    }),
  }),
  extractRehydrationInfo: (action, { reducerPath }): any => {
    if (isHydrateAction(action)) {
      const supportedNetworkIdsForApprovalTxs = getSupportedNetworkIdsForApprovalTxsInHomefeed()

      const persistedTransactionsState: RootState['transactions'] = getRehydratePayload(
        action,
        'transactions'
      )
      const walletPersistedState: RootState['web3'] = getRehydratePayload(action, 'web3')
      const walletAddress = walletPersistedState.account?.toLowerCase() ?? null
      const standbyTransactions = persistedTransactionsState.standbyTransactions.filter((tx) => {
        if (tx.__typename === 'TokenApproval') {
          return supportedNetworkIdsForApprovalTxs.includes(tx.networkId)
        }
        return true
      })

      const cachedApiState = { ...action.payload[reducerPath] }

      // eslint-disable-next-line no-restricted-syntax
      for (const queryKey in cachedApiState.queries) {
        const queryState = cachedApiState.queries[queryKey]
        if (queryState?.originalArgs === walletAddress) {
          const data = queryState.data as Response
          const hashes = data.transactions.map((tx) => tx.transactionHash)

          data.transactions = standbyTransactions
            .reduce((acc, tx) => {
              if (tx.transactionHash && !hashes.includes(tx.transactionHash)) {
                acc.push({
                  block: '',
                  fees: [],
                  transactionHash: tx.transactionHash || '',
                  ...tx, // in case the transaction already has the above (e.g. cross chain swaps), use the real values
                })
              }
              return acc
            }, data.transactions)
            .sort((a, b) => b.timestamp - a.timestamp)

          // console.log(data.transactions.length)
          // console.log(data.transactions.map((tx) => new Date(tx.timestamp)).join('\n'))
        }
      }

      return cachedApiState
    }

    return undefined
  },
})

const { useTransactionFeedV2Query } = transactionFeedV2Api

function getAllowedNetworkIdsForTransfers() {
  return getMultichainFeatures().showTransfers.join(',').split(',') as NetworkId[]
}

export default function TransactionFeedV2() {
  const address = useSelector(walletAddressSelector)

  const { sections, isFetching, error } = useTransactionFeedV2Query(address ?? skipToken, {
    selectFromResult: (result) => {
      const { data } = result
      const transactions = data?.transactions || []
      const allowedNetworks = getAllowedNetworkIdsForTransfers()

      const { pending, confirmed } = transactions
        .filter((tx) => allowedNetworks.includes(tx.networkId))
        .reduce(
          (acc, tx) => {
            const key: keyof typeof acc =
              tx.status === TransactionStatus.Pending ? 'pending' : 'confirmed'
            acc[key].push(tx)
            return acc
          },
          {
            pending: [] as TokenTransaction[],
            confirmed: [] as TokenTransaction[],
          }
        )

      const noTransactions = pending.length === 0 && confirmed.length === 0
      const sections = noTransactions ? [] : groupFeedItemsInSections(pending, confirmed)

      return { ...result, sections }
    },
  })

  if (!sections.length) {
    return getFeatureGate(StatsigFeatureGates.SHOW_GET_STARTED) ? (
      <GetStarted />
    ) : (
      <NoActivity loading={isFetching} error={error as any} />
    )
  }

  function fetchMoreTransactions() {}

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
        initialNumToRender={20}
      />
      {isFetching && (
        <View style={styles.centerContainer}>
          <ActivityIndicator style={styles.loadingIcon} size="large" color={colors.primary} />
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
