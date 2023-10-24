import { createSelector } from 'reselect'
import { ActionTypes as ExchangeActionTypes } from 'src/exchange/actions'
import { NumberToRecipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/transactions/actions'
import { StandbyTransaction, TokenTransaction, TransactionStatus } from 'src/transactions/types'

export interface InviteTransactions {
  [txHash: string]: {
    paymentId: string
    recipientIdentifier: string
  }
}
export interface State {
  // Tracks transactions that have been initiated by the user
  // before they are picked up by the chain explorer and
  // included in the tx feed. Necessary so it shows up in the
  // feed instantly.
  standbyTransactions: StandbyTransaction[]
  // Tracks which set of transactions retrieved in the
  // feed have already been processed by the
  // tx feed query watcher. Necessary so we don't re-process
  // txs more than once.
  knownFeedTransactions: KnownFeedTransactionsType
  recentTxRecipientsCache: NumberToRecipient
  transactions: TokenTransaction[]
  // invite transactions are from the escrow contract, the following property maps
  // transaction hash to recipient known to user
  inviteTransactions: InviteTransactions
}

export interface KnownFeedTransactionsType {
  // Value will be an address string for transfer transactions
  // and true boolean for exchange transactions
  [txHash: string]: string | boolean
}

const initialState = {
  standbyTransactions: [],
  knownFeedTransactions: {},
  recentTxRecipientsCache: {},
  transactions: [],
  inviteTransactions: {},
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | ExchangeActionTypes
): State => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        ...getRehydratePayload(action, 'transactions'),
      }
    }
    case Actions.ADD_STANDBY_TRANSACTION:
      return {
        ...state,
        standbyTransactions: [
          {
            ...action.transaction,
            timestamp: Date.now(),
            status: TransactionStatus.Pending,
          },
          ...(state.standbyTransactions || []),
        ],
      }
    case Actions.REMOVE_STANDBY_TRANSACTION:
      return {
        ...state,
        standbyTransactions: state.standbyTransactions.filter(
          (tx: StandbyTransaction) => tx.context.id !== action.idx
        ),
      }
    case Actions.TRANSACTION_CONFIRMED:
      const status = action.receipt.status

      if (!status) {
        return {
          ...state,
        }
      }

      return {
        ...state,
        standbyTransactions: mapForContextId(state.standbyTransactions, action.txId, (tx) => {
          return {
            ...tx,
            status: TransactionStatus.Complete,
          }
        }),
      }
    case Actions.TRANSACTION_CONFIRMED_VIEM:
      return {
        ...state,
        standbyTransactions: mapForContextId(state.standbyTransactions, action.txId, (tx) => {
          return {
            ...tx,
            status: TransactionStatus.Complete,
          }
        }),
      }
    case Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS:
      return {
        ...state,
        standbyTransactions: mapForContextId(state.standbyTransactions, action.idx, (tx) => {
          return {
            ...tx,
            transactionHash: action.hash,
          }
        }),
      }
    case Actions.NEW_TRANSACTIONS_IN_FEED:
      const newKnownFeedTransactions = { ...state.knownFeedTransactions }
      action.transactions.forEach((tx) => {
        newKnownFeedTransactions[tx.hash] = tx.address
      })
      return {
        ...state,
        knownFeedTransactions: newKnownFeedTransactions,
      }
    case Actions.UPDATE_RECENT_TX_RECIPIENT_CACHE:
      return {
        ...state,
        recentTxRecipientsCache: action.recentTxRecipientsCache,
      }
    case Actions.UPDATE_TRANSACTIONS:
      return {
        ...state,
        transactions: action.transactions,
      }
    case Actions.UPDATE_INVITE_TRANSACTIONS:
      return {
        ...state,
        inviteTransactions: action.inviteTransactions,
      }
    default:
      return state
  }
}

function mapForContextId(
  txs: { context: { id: string } }[],
  contextId: string,
  mapping: (tx: any) => any
) {
  return txs.map((tx) => {
    if (tx.context.id !== contextId) {
      return tx
    }
    return mapping(tx)
  })
}

export const pendingStandbyTransactionsSelector = createSelector(
  [(state: RootState) => state.transactions.standbyTransactions],
  (transactions) => {
    return transactions
      .filter((transaction) => transaction.status === TransactionStatus.Pending)
      .map((transaction) => ({
        ...transaction,
        transactionHash: transaction.transactionHash || '',
        block: '',
        fees: [],
      }))
  }
)

export const knownFeedTransactionsSelector = (state: RootState) =>
  state.transactions.knownFeedTransactions

export const recentTxRecipientsCacheSelector = (state: RootState) =>
  state.transactions.recentTxRecipientsCache

export const transactionsSelector = (state: RootState) => state.transactions.transactions

export const inviteTransactionsSelector = (state: RootState) =>
  state.transactions.inviteTransactions

export const transactionHashesSelector = (state: RootState) =>
  state.transactions.transactions.map((tx) => tx.transactionHash)
