import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as React from 'react'
import { Query, QueryResult } from 'react-apollo'
import { connect } from 'react-redux'
import { MoneyAmount, TokenTransactionType, UserTransactionsQuery } from 'src/apollo/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  getLocalCurrencyCode,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { newTransactionsInFeed } from 'src/transactions/actions'
import { knownFeedTransactionsSelector, KnownFeedTransactionsType } from 'src/transactions/reducer'
import TransactionFeed, {
  FeedItem,
  FeedType,
  TransactionFeedFragments,
} from 'src/transactions/TransactionFeed'
import { getNewTxsFromUserTxQuery, getTxsFromUserTxQuery } from 'src/transactions/transferFeedUtils'
import {
  ExchangeStandbyLegacy,
  StandbyTransactionLegacy,
  TransactionStatus,
  TransferStandbyLegacy,
} from 'src/transactions/types'
import { CURRENCIES, Currency, STABLE_CURRENCIES } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionsList'
// Query poll interval
export const POLL_INTERVAL = 10000 // 10 secs

interface OwnProps {
  feedType: FeedType
}

interface StateProps {
  address?: string | null
  standbyTransactions: StandbyTransactionLegacy[]
  localCurrencyCode: LocalCurrencyCode
  localCurrencyExchangeRates: Record<Currency, string | null>
  knownFeedTransactions: KnownFeedTransactionsType
}

interface DispatchProps {
  newTransactionsInFeed: typeof newTransactionsInFeed
}

type Props = OwnProps & StateProps & DispatchProps

export const TRANSACTIONS_QUERY = gql`
  query UserTransactions($address: Address!, $tokens: [Token], $localCurrencyCode: String) {
    tokenTransactions(address: $address, tokens: $tokens, localCurrencyCode: $localCurrencyCode) {
      edges {
        node {
          ...TransactionFeed
        }
      }
    }
  }

  ${TransactionFeedFragments.transaction}
`

const mapStateToProps = (state: RootState): StateProps => ({
  address: currentAccountSelector(state),
  standbyTransactions: state.transactions.standbyTransactionsLegacy,
  localCurrencyCode: getLocalCurrencyCode(state),
  localCurrencyExchangeRates: localCurrencyExchangeRatesSelector(state),
  knownFeedTransactions: knownFeedTransactionsSelector(state),
})

function resolveAmount(
  moneyAmount: Pick<MoneyAmount, 'value' | 'currencyCode'>,
  localCurrencyCode: LocalCurrencyCode,
  exchangeRate: string | null | undefined
) {
  if (!localCurrencyCode || !exchangeRate) {
    return { ...moneyAmount, localAmount: null }
  }

  return {
    ...moneyAmount,
    localAmount: {
      value: new BigNumber(moneyAmount.value).multipliedBy(exchangeRate),
      currencyCode: localCurrencyCode as string,
      exchangeRate,
    },
  }
}

function mapExchangeStandbyToFeedItem(
  standbyTx: ExchangeStandbyLegacy,
  feedType: FeedType,
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyToStableExchangeRate: string | null | undefined
): FeedItem {
  const { type, hash, status, timestamp, inValue, inCurrency, outValue, outCurrency } = standbyTx

  const inAmount = {
    value: new BigNumber(inValue),
    currencyCode: inCurrency,
  }
  const outAmount = {
    value: new BigNumber(outValue),
    currencyCode: outCurrency,
  }

  const exchangeRate = new BigNumber(outAmount.value).dividedBy(inAmount.value)
  const localExchangeRate = new BigNumber(localCurrencyToStableExchangeRate ?? 0)
  const makerLocalExchangeRate =
    inAmount.currencyCode === Currency.Celo
      ? exchangeRate.multipliedBy(localExchangeRate)
      : localExchangeRate
  const takerLocalExchangeRate =
    outAmount.currencyCode === Currency.Celo
      ? exchangeRate.pow(-1).multipliedBy(localExchangeRate)
      : localExchangeRate

  const makerAmount = resolveAmount(inAmount, localCurrencyCode, makerLocalExchangeRate.toString())
  const takerAmount = resolveAmount(outAmount, localCurrencyCode, takerLocalExchangeRate.toString())

  // Find amount relative to the queried currency
  const accountAmount = [makerAmount, takerAmount].find((amount) => {
    const amountCurrency = amount.currencyCode as Currency
    return feedType === FeedType.EXCHANGE
      ? amountCurrency === Currency.Celo
      : STABLE_CURRENCIES.some((stableCurrency) => stableCurrency === amountCurrency)
  })

  if (!accountAmount) {
    // This is not supposed to happen
    throw new Error('Unable to find amount relative to the queried currency')
  }

  return {
    __typename: 'TokenExchange',
    type,
    hash: hash ?? '',
    timestamp,
    status,
    amount: resolveAmount(
      {
        ...accountAmount,
        // Signed amount relative to the queried account currency
        value: new BigNumber(accountAmount.value).multipliedBy(
          accountAmount === makerAmount ? -1 : 1
        ),
      },
      localCurrencyCode,
      accountAmount.localAmount?.exchangeRate
    ),
    makerAmount,
    takerAmount,
  }
}

function mapTransferStandbyToFeedItem(
  standbyTx: TransferStandbyLegacy,
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyExchangeRate: string | null | undefined
): FeedItem {
  const { type, hash, status, timestamp, value, currency, address, comment } = standbyTx

  return {
    __typename: 'TokenTransfer',
    type,
    hash: hash ?? '',
    timestamp,
    status,
    amount: resolveAmount(
      {
        // Signed amount relative to the queried account currency
        // Standby transfers are always outgoing
        value: new BigNumber(value).multipliedBy(-1),
        currencyCode: currency,
      },
      localCurrencyCode,
      localCurrencyExchangeRate
    ),
    comment,
    address,
    // the account address is NOT the same as "address", but the correct info isn't needed for the standby transactions
    account: address,
    defaultImage: null,
    defaultName: null,
  }
}

function mapStandbyTransactionToFeedItem(
  feedType: FeedType,
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyExchangeRates: Record<Currency, string | null>
) {
  return (standbyTx: StandbyTransactionLegacy): FeedItem => {
    if (standbyTx.type === TokenTransactionType.Exchange) {
      return mapExchangeStandbyToFeedItem(
        standbyTx,
        feedType,
        localCurrencyCode,
        localCurrencyExchangeRates[
          standbyTx.inCurrency === Currency.Celo ? standbyTx.outCurrency : standbyTx.inCurrency
        ]
      )
    }
    // Otherwise it's a transfer
    else {
      return mapTransferStandbyToFeedItem(
        standbyTx,
        localCurrencyCode,
        localCurrencyExchangeRates[standbyTx.currency]
      )
    }
  }
}

export class TransactionsList extends React.PureComponent<Props> {
  onTxsFetched = (data: UserTransactionsQuery | undefined) => {
    Logger.debug(TAG, 'onTxsFetched handler triggered')
    const newTxs = getNewTxsFromUserTxQuery(data, this.props.knownFeedTransactions)
    if (!newTxs || !newTxs.length) {
      return
    }

    this.props.newTransactionsInFeed(newTxs)
  }

  render() {
    const {
      address,
      feedType,
      localCurrencyCode,
      localCurrencyExchangeRates,
      standbyTransactions,
    } = this.props

    const queryAddress = address || ''
    const tokens = feedType === FeedType.EXCHANGE ? [Currency.Celo] : Object.keys(CURRENCIES)

    const UserTransactions = ({
      loading,
      error,
      data,
    }: QueryResult<UserTransactionsQuery | undefined>) => {
      const transactions = getTxsFromUserTxQuery(data).map((transaction) => ({
        ...transaction,
        status: TransactionStatus.Complete,
      }))

      // Filter out standby transactions that aren't for the queried currency or are already in the received transactions
      const queryDataTxHashes = new Set(transactions.map((tx) => tx.hash))
      const standbyTxs = standbyTransactions
        .filter((tx) => {
          const isForQueriedCurrency =
            feedType === FeedType.HOME ||
            tokens.includes((tx as TransferStandbyLegacy).currency) ||
            tokens.includes((tx as ExchangeStandbyLegacy).inCurrency) ||
            tokens.includes((tx as ExchangeStandbyLegacy).outCurrency)
          const notInQueryTxs =
            (!tx.hash || !queryDataTxHashes.has(tx.hash)) && tx.status !== TransactionStatus.Failed
          return isForQueriedCurrency && notInQueryTxs
        })
        .map(
          mapStandbyTransactionToFeedItem(feedType, localCurrencyCode, localCurrencyExchangeRates)
        )

      const feedData = [...standbyTxs, ...transactions]

      return <TransactionFeed kind={feedType} loading={loading} error={error} data={feedData} />
    }

    return (
      <Query
        query={TRANSACTIONS_QUERY}
        pollInterval={POLL_INTERVAL}
        variables={{ address: queryAddress, tokens, localCurrencyCode }}
        children={UserTransactions}
        onCompleted={this.onTxsFetched}
        // Adding this option because the onCompleted doesn't work properly without it.
        // It causes the onCompleted to trigger too often but that's okay.
        // https://github.com/apollographql/react-apollo/issues/2293
        notifyOnNetworkStatusChange={true}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  newTransactionsInFeed,
})(TransactionsList)
