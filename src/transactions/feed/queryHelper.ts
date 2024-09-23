import BigNumber from 'bignumber.js'
import { isEmpty } from 'lodash'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-simple-toast'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SwapEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { AppDispatch, store } from 'src/redux/store'
import { getMultichainFeatures } from 'src/statsig/index'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { updateTransactions } from 'src/transactions/actions'
import {
  completedTxHashesByNetworkIdSelector,
  pendingStandbyTxHashesByNetworkIdSelector,
  pendingTxHashesByNetworkIdSelector,
  transactionsSelector,
} from 'src/transactions/reducer'
import {
  FeeType,
  NetworkId,
  TokenExchange,
  TokenTransaction,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { gql } from 'src/utils/gql'
import { walletAddressSelector } from 'src/web3/selectors'

const MIN_NUM_TRANSACTIONS = 10

export interface QueryHookResult {
  loading: boolean
  error: Error | undefined
  transactions: TokenTransaction[]
  fetchingMoreTransactions: boolean
  fetchMoreTransactions: () => void
}
interface PageInfo {
  startCursor: string | null
  endCursor: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
}
export interface QueryResponse {
  transactions: TokenTransaction[]
  pageInfo: PageInfo
}

const TAG = 'transactions/feed/queryHelper'

// Query poll interval
const POLL_INTERVAL = 10000 // 10 secs

// returns a new array that is the combination of the two transaction arrays, with
// duplicated transactions removed. In the case of duplicate transactions, the
// one from the incomingTx array is kept.
export const deduplicateTransactions = (
  existingTxs: TokenTransaction[],
  incomingTxs: TokenTransaction[]
) => {
  const transactionsByTxHash: { [txHash: string]: TokenTransaction } = {}
  const combinedTxs = [...existingTxs, ...incomingTxs]
  combinedTxs.forEach((transaction) => {
    transactionsByTxHash[transaction.transactionHash] = transaction
  })

  return Object.values(transactionsByTxHash)
}

export function useAllowedNetworkIdsForTransfers() {
  // return a string to help react memoization
  const allowedNetworkIdsString = getMultichainFeatures().showTransfers.join(',')
  // N.B: This fetch-time filtering does not suffice to prevent non-Celo TXs from appearing
  // on the home feed, since they get cached in Redux -- this is just a network optimization.
  return useMemo(() => {
    return allowedNetworkIdsString.split(',') as NetworkId[]
  }, [allowedNetworkIdsString])
}

export function useFetchTransactions(): QueryHookResult {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const pendingTxHashesByNetwork = useSelector(pendingTxHashesByNetworkIdSelector)
  const completedTxHashesByNetwork = useSelector(completedTxHashesByNetworkIdSelector)
  const cachedTransactions = useSelector(transactionsSelector)
  const pendingStandbyTxHashesByNetwork = useSelector(pendingStandbyTxHashesByNetworkIdSelector)
  const allowedNetworkIds = useAllowedNetworkIdsForTransfers()

  const [fetchedResult, setFetchedResult] = useState<{
    transactions: TokenTransaction[]
    pageInfo: PageInfo | null
  }>({
    transactions: cachedTransactions,
    pageInfo: null,
  })

  const [fetchingMoreTransactions, setFetchingMoreTransactions] = useState(false)

  useEffect(() => {
    // kick off a request for new transactions, and then poll for new
    // transactions periodically
    void pollNewTransactions.execute()

    // const id = setInterval(() => {
    //   console.log('==polling')
    //   void pollNewTransactions.execute()
    //   clearInterval(id)
    // }, POLL_INTERVAL)

    return () => {} //clearInterval(id)
  }, [])

  const handleError = (error: Error) => {
    Logger.error(TAG, 'Error while fetching transactions', error)
  }

  // Query for new transaction every POLL_INTERVAL
  const pollNewTransactions = useAsyncCallback(
    async () => {
      await queryTransactionsFeed({
        address,
        localCurrencyCode,
        allowedNetworkIds,
        afterCursor: null,
        onResponse: handlePollResponse({
          pageInfo: fetchedResult.pageInfo,
          setFetchedResult,
          completedTxHashesByNetwork,
          pendingTxHashesByNetwork,
          pendingStandbyTxHashesByNetwork,
          dispatch,
        }),
      })
    },
    {
      onError: handleError,
    }
  )

  // Query for more transactions if requested
  useAsync(
    async () => {
      if (!fetchedResult.pageInfo?.hasNextPage) {
        setFetchingMoreTransactions(false)
        return
      }
      await queryTransactionsFeed({
        address,
        localCurrencyCode,
        allowedNetworkIds,
        afterCursor: fetchedResult.pageInfo.endCursor,
        onResponse: (result) => {
          const returnedTransactions = result?.data.tokenTransactionsV3?.transactions ?? []
          const returnedPageInfo = result?.data.tokenTransactionsV3?.pageInfo ?? null
          if (returnedTransactions.length || returnedPageInfo?.hasNextPage) {
            setFetchedResult((prev) => ({
              transactions: deduplicateTransactions(prev.transactions, returnedTransactions),
              pageInfo: returnedPageInfo,
            }))
          }
        },
      })
      setFetchingMoreTransactions(false)
    },
    [fetchingMoreTransactions],
    {
      onError: (e) => {
        setFetchingMoreTransactions(false)
        dispatch(showError(ErrorMessages.FETCH_FAILED))
        handleError(e)
      },
    }
  )

  useEffect(() => {
    const { transactions, pageInfo } = fetchedResult
    if (
      !pollNewTransactions.loading &&
      pageInfo?.hasNextPage &&
      transactions.length < MIN_NUM_TRANSACTIONS
    ) {
      setFetchingMoreTransactions(true)
    }
  }, [fetchedResult, pollNewTransactions.loading])

  return {
    loading: pollNewTransactions.loading,
    error: pollNewTransactions.error,
    transactions: fetchedResult.transactions,
    fetchingMoreTransactions,
    fetchMoreTransactions: () => {
      if (!fetchedResult.pageInfo) {
        dispatch(showError(ErrorMessages.FETCH_FAILED))
      } else if (
        !fetchedResult.pageInfo.hasNextPage &&
        fetchedResult.transactions.length > MIN_NUM_TRANSACTIONS
      ) {
        Toast.showWithGravity(t('noMoreTransactions'), Toast.SHORT, Toast.CENTER)
      } else {
        setFetchingMoreTransactions(true)
      }
    },
  }
}

export function handlePollResponse({
  pageInfo,
  setFetchedResult,
  completedTxHashesByNetwork,
  pendingTxHashesByNetwork,
  pendingStandbyTxHashesByNetwork,
  dispatch,
}: {
  pageInfo: PageInfo | null
  setFetchedResult: Dispatch<
    SetStateAction<{
      transactions: TokenTransaction[]
      pageInfo: PageInfo | null
    }>
  >
  completedTxHashesByNetwork: { [key in NetworkId]?: Set<string> }
  pendingTxHashesByNetwork: { [key in NetworkId]?: Set<string> }
  pendingStandbyTxHashesByNetwork: { [key in NetworkId]?: Set<string> }
  dispatch: AppDispatch
}) {
  return function (result: QueryResponse | null) {
    const returnedTransactions = result?.transactions ?? []
    const returnedPageInfo = result?.pageInfo ?? null

    if (returnedTransactions.length || returnedPageInfo?.hasNextPage) {
      setFetchedResult((prev) => ({
        transactions: deduplicateTransactions(prev.transactions, returnedTransactions),
        pageInfo: returnedPageInfo,
      }))
    }
    if (returnedTransactions.length) {
      // We store the first page in redux to show them to the users when they open the app.
      // Filter out now empty transactions to avoid redux issues
      const nonEmptyTransactions = returnedTransactions.filter(
        (returnedTransaction) => !isEmpty(returnedTransaction)
      )
      let shouldUpdateCachedTransactions = false
      let hasNewCompletedTransaction = false

      // Compare the new tx hashes with the ones we already have in redux
      for (const tx of nonEmptyTransactions) {
        if (tx.status === TransactionStatus.Complete) {
          if (!completedTxHashesByNetwork[tx.networkId]?.has(tx.transactionHash)) {
            shouldUpdateCachedTransactions = true
            hasNewCompletedTransaction = true
          }

          if (
            // Track cross-chain swap transaction status change to `Complete`
            tx.__typename === 'CrossChainTokenExchange' &&
            (pendingStandbyTxHashesByNetwork[tx.networkId]?.has(tx.transactionHash) ||
              pendingTxHashesByNetwork[tx.networkId]?.has(tx.transactionHash))
          ) {
            trackCrossChainSwapSuccess(tx)
          }
        } else if (tx.status === TransactionStatus.Pending) {
          if (!pendingTxHashesByNetwork[tx.networkId]?.has(tx.transactionHash)) {
            shouldUpdateCachedTransactions = true
          }
        }
      }
      // If there are new transactions update transactions in redux and fetch balances
      if (shouldUpdateCachedTransactions) {
        dispatch(updateTransactions(nonEmptyTransactions))
      }
      if (hasNewCompletedTransaction) {
        vibrateSuccess()
      }
    }
  }
}

async function queryTransactionsFeed({
  address,
  localCurrencyCode,
  allowedNetworkIds,
  afterCursor,
  onResponse,
}: {
  address: string | null
  localCurrencyCode: string
  allowedNetworkIds: NetworkId[]
  afterCursor: string | null
  onResponse: (data: QueryResponse | null) => void
}): Promise<void> {
  Logger.info(TAG, `Fetching transactions with cursor: ${afterCursor}`)

  const url = new URL(`http://localhost:8080/wallet/${address}/transactions`)
  url.searchParams.append('networkIds', allowedNetworkIds.join(','))
  url.searchParams.append('localCurrencyCode', localCurrencyCode)
  if (afterCursor) {
    url.searchParams.append('afterCursor', afterCursor)
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
  const result = (await response.json()) as QueryResponse
  Logger.info(TAG, `Fetched transactions`, result)
  onResponse(result)
}

function trackCrossChainSwapSuccess(tx: TokenExchange) {
  const tokensById = tokensByIdSelector(store.getState(), getSupportedNetworkIdsForSwap())

  const toTokenPrice = tokensById[tx.inAmount.tokenId]?.priceUsd
  const fromTokenPrice = tokensById[tx.outAmount.tokenId]?.priceUsd

  const networkFee = tx.fees.find((fee) => fee.type === FeeType.SecurityFee)
  const networkFeeTokenPrice = networkFee && tokensById[networkFee?.amount.tokenId]?.priceUsd
  const appFee = tx.fees.find((fee) => fee.type === FeeType.AppFee)
  const appFeeTokenPrice = appFee && tokensById[appFee?.amount.tokenId]?.priceUsd
  const crossChainFee = tx.fees.find((fee) => fee.type === FeeType.CrossChainFee)
  const crossChainFeeTokenPrice =
    crossChainFee && tokensById[crossChainFee?.amount.tokenId]?.priceUsd

  AppAnalytics.track(SwapEvents.swap_execute_success, {
    swapType: 'cross-chain',
    swapExecuteTxId: tx.transactionHash,
    toTokenId: tx.inAmount.tokenId,
    toTokenAmount: tx.inAmount.value.toString(),
    toTokenAmountUsd: toTokenPrice
      ? BigNumber(tx.inAmount.value).times(toTokenPrice).toNumber()
      : undefined,
    fromTokenId: tx.outAmount.tokenId,
    fromTokenAmount: tx.outAmount.value.toString(),
    fromTokenAmountUsd: fromTokenPrice
      ? BigNumber(tx.outAmount.value).times(fromTokenPrice).toNumber()
      : undefined,
    networkFeeTokenId: networkFee?.amount.tokenId,
    networkFeeAmount: networkFee?.amount.value.toString(),
    networkFeeAmountUsd:
      networkFeeTokenPrice && networkFee.amount.value
        ? BigNumber(networkFee.amount.value).times(networkFeeTokenPrice).toNumber()
        : undefined,
    appFeeTokenId: appFee?.amount.tokenId,
    appFeeAmount: appFee?.amount.value.toString(),
    appFeeAmountUsd:
      appFeeTokenPrice && appFee.amount.value
        ? BigNumber(appFee.amount.value).times(appFeeTokenPrice).toNumber()
        : undefined,
    crossChainFeeTokenId: crossChainFee?.amount.tokenId,
    crossChainFeeAmount: crossChainFee?.amount.value.toString(),
    crossChainFeeAmountUsd:
      crossChainFeeTokenPrice && crossChainFee.amount.value
        ? BigNumber(crossChainFee.amount.value).times(crossChainFeeTokenPrice).toNumber()
        : undefined,
  })
}

export const TRANSACTIONS_QUERY = gql`
  query UserTransactions(
    $address: Address!
    $localCurrencyCode: String
    $afterCursor: String
    $networkId: NetworkId!
  ) {
    tokenTransactionsV3(
      address: $address
      localCurrencyCode: $localCurrencyCode
      afterCursor: $afterCursor
      networkId: $networkId
    ) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      transactions {
        ...TokenTransferItemV3
        ...NftTransferItemV3
        ...TokenExchangeItemV3
        ...EarnDepositItem
        ...EarnSwapDepositItem
        ...EarnWithdrawItem
        ...EarnClaimRewardItem
        ...TokenApprovalItem
        ...CrossChainTokenExchangeItem
      }
    }
  }

  fragment TokenTransferItemV3 on TokenTransferV3 {
    __typename
    type
    transactionHash
    timestamp
    status
    block
    address
    metadata {
      title
      subtitle
      image
    }
    amount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment NftTransferItemV3 on NftTransferV3 {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    nfts {
      tokenId
      contractAddress
      tokenUri
      ownerAddress
      metadata {
        name
        description
        image
        id
        dna
        date
        attributes {
          trait_type
          value
        }
      }
      media {
        raw
        gateway
      }
    }
  }

  fragment TokenExchangeItemV3 on TokenExchangeV3 {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    metadata {
      title
      subtitle
    }
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment CrossChainTokenExchangeItem on CrossChainTokenExchange {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnSwapDepositItem on EarnSwapDeposit {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    swap {
      inAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      outAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
    deposit {
      inAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      outAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      providerId
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnDepositItem on EarnDeposit {
    __typename
    type
    transactionHash
    status
    providerId
    timestamp
    block
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnWithdrawItem on EarnWithdraw {
    __typename
    type
    transactionHash
    status
    providerId
    timestamp
    block
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnClaimRewardItem on EarnClaimReward {
    __typename
    type
    transactionHash
    status
    providerId
    timestamp
    block
    amount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment TokenApprovalItem on TokenApproval {
    __typename
    type
    timestamp
    block
    transactionHash
    status
    tokenId
    approvedAmount
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }
`
