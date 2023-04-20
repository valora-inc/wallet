import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as React from 'react'
import { Query, QueryResult } from 'react-apollo'
import { connect } from 'react-redux'
import { MoneyAmount, UserTransactionsQuery } from 'src/apollo/types'
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
  TransactionFeedFragments,
} from 'src/transactions/TransactionFeed'
import { getNewTxsFromUserTxQuery, getTxsFromUserTxQuery } from 'src/transactions/transferFeedUtils'
import { StandbyTransactionLegacy, TransactionStatus } from 'src/transactions/types'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionsList'
// Query poll interval
export const POLL_INTERVAL = 10000 // 10 secs

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

type Props = StateProps & DispatchProps

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

function mapTransferStandbyToFeedItem(
  standbyTx: StandbyTransactionLegacy,
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
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyExchangeRates: Record<Currency, string | null>
) {
  return (standbyTx: StandbyTransactionLegacy): FeedItem => {
    return mapTransferStandbyToFeedItem(
      standbyTx,
      localCurrencyCode,
      localCurrencyExchangeRates[standbyTx.currency]
    )
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
    const { address, localCurrencyCode, localCurrencyExchangeRates, standbyTransactions } =
      this.props

    const queryAddress = address || ''
    const tokens = Object.keys(CURRENCIES)

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
          const notInQueryTxs =
            (!tx.hash || !queryDataTxHashes.has(tx.hash)) && tx.status !== TransactionStatus.Failed
          return notInQueryTxs
        })
        .map(mapStandbyTransactionToFeedItem(localCurrencyCode, localCurrencyExchangeRates))

      const feedData = [...standbyTxs, ...transactions]

      return <TransactionFeed loading={loading} error={error} data={feedData} />
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

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  newTransactionsInFeed,
})(TransactionsList)
