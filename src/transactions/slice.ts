import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, type RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import {
  TransactionStatus,
  type EarnClaimReward,
  type EarnDeposit,
  type EarnSwapDeposit,
  type EarnWithdraw,
  type Fee,
  type NetworkId,
  type NftTransfer,
  type PendingStandbyTransaction,
  type StandbyTransaction,
  type TokenApproval,
  type TokenExchange,
  type TokenTransaction,
  type TokenTransfer,
} from 'src/transactions/types'

type BaseStandbyTransactionType<T> = Omit<PendingStandbyTransaction<T>, 'timestamp' | 'status'>

export type BaseStandbyTransaction =
  | BaseStandbyTransactionType<TokenTransfer>
  | BaseStandbyTransactionType<TokenExchange>
  | BaseStandbyTransactionType<TokenApproval>
  | BaseStandbyTransactionType<NftTransfer>
  | BaseStandbyTransactionType<EarnDeposit>
  | BaseStandbyTransactionType<EarnSwapDeposit>
  | BaseStandbyTransactionType<EarnWithdraw>
  | BaseStandbyTransactionType<EarnClaimReward>

// this type would ideally be TransactionReceipt from viem however the numbers
// are of type bigint which is not serializable and causes problems at runtime
type BaseTransactionReceipt = {
  status: TransactionStatus
  block: string
  transactionHash: string
  fees?: Fee[]
}

export type UpdateTransactionsPayload = PayloadAction<{
  networkId: NetworkId
  transactions: TokenTransaction[]
}>

type TransactionsByNetworkId = {
  [networkId in NetworkId]?: TokenTransaction[]
}

interface State {
  // Tracks transactions that have been initiated by the user
  // before they are picked up by the chain explorer and
  // included in the tx feed. Necessary so it shows up in the
  // feed instantly.
  standbyTransactions: StandbyTransaction[]
  transactionsByNetworkId: TransactionsByNetworkId
  feedFirstPage: TokenTransaction[]
}

const initialState: State = {
  standbyTransactions: [],
  transactionsByNetworkId: {},
  feedFirstPage: [],
}

// export for testing
export const _initialState = initialState

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addStandbyTransaction: (
      state,
      action: PayloadAction<{ transaction: BaseStandbyTransaction }>
    ) => {
      // Removing any duplicate transactions
      const otherStandbyTransactions = (state.standbyTransactions || []).filter(
        (tx) =>
          !(
            tx.context.id === action.payload.transaction.context.id ||
            (action.payload.transaction.transactionHash &&
              tx.transactionHash === action.payload.transaction.transactionHash)
          )
      )

      return {
        ...state,
        standbyTransactions: [
          {
            ...action.payload.transaction,
            timestamp: Date.now(),
            status: TransactionStatus.Pending,
          },
          ...otherStandbyTransactions,
        ],
      }
    },

    transactionConfirmed: (
      state,
      action: PayloadAction<{
        txId: string
        receipt: BaseTransactionReceipt
        blockTimestampInMs: number
      }>
    ) => {
      const { status, transactionHash, block, fees } = action.payload.receipt

      return {
        ...state,
        standbyTransactions: state.standbyTransactions.map(
          (standbyTransaction): StandbyTransaction => {
            if (standbyTransaction.context.id === action.payload.txId) {
              return {
                ...standbyTransaction,
                status: status,
                transactionHash,
                block,
                timestamp: action.payload.blockTimestampInMs,
                fees: fees || [],
                ...(standbyTransaction.__typename === 'CrossChainTokenExchange' && {
                  isSourceNetworkTxConfirmed: true,
                }),
              }
            }
            return standbyTransaction
          }
        ),
      }
    },

    updateTransactions: (state, action: UpdateTransactionsPayload) => {
      const standbyTransactionHashes = new Set(
        state.standbyTransactions
          .map((tx) => tx.transactionHash)
          .filter((hash) => hash !== undefined)
      )

      // Separate pending cross-chain swap transactions from other received
      // transactions for custom processing. Usually transactions received from
      // blockchain-api should overwrite standby transaction but for pending
      // cross chain swaps, we want to augment the existing standby transaction
      // with the received transaction information. This is because the standby
      // transaction contains information about the intended inAmount value
      // which blockchain-api does not have access to whilst the transaction is
      // pending.
      const receivedTransactions: TokenTransaction[] = []
      const pendingCrossChainTxsWithStandby: TokenExchange[] = []
      action.payload.transactions.forEach((tx) => {
        if (
          tx.status === TransactionStatus.Pending &&
          tx.__typename === 'CrossChainTokenExchange' &&
          standbyTransactionHashes.has(tx.transactionHash)
        ) {
          pendingCrossChainTxsWithStandby.push(tx)
        } else {
          receivedTransactions.push(tx)
        }
      })

      const receivedTxHashes = new Set(receivedTransactions.map((tx) => tx.transactionHash))
      const updatedStandbyTransactions = state.standbyTransactions
        .filter(
          // remove standby transactions that match non cross-chain swap transactions from blockchain-api
          (standbyTx) =>
            !standbyTx.transactionHash ||
            standbyTx.networkId !== action.payload.networkId ||
            !receivedTxHashes.has(standbyTx.transactionHash)
        )
        .map((standbyTx) => {
          // augment existing standby cross chain swap transactions with
          // received tx information from blockchain-api, but keep the estimated
          // inAmount value from the original standby transaction
          if (standbyTx.transactionHash && standbyTx.__typename === 'CrossChainTokenExchange') {
            const receivedCrossChainTx = pendingCrossChainTxsWithStandby.find(
              (tx) => tx.transactionHash === standbyTx.transactionHash
            )
            if (receivedCrossChainTx) {
              return {
                ...standbyTx,
                ...receivedCrossChainTx,
                inAmount: {
                  ...receivedCrossChainTx.inAmount,
                  value: standbyTx.inAmount.value,
                },
              }
            }
          }

          return standbyTx
        })

      return {
        ...state,
        transactionsByNetworkId: {
          ...state.transactionsByNetworkId,
          [action.payload.networkId]: receivedTransactions,
        },
        standbyTransactions: updatedStandbyTransactions,
      }
    },

    removeDuplicatedStandByTransactions: (
      state,
      action: PayloadAction<{ newPageTransactions: TokenTransaction[] }>
    ) => {
      const confirmedTransactionsFromNewPage = action.payload.newPageTransactions
        .filter((tx) => tx.status !== TransactionStatus.Pending)
        .map((tx) => tx.transactionHash)

      return {
        ...state,
        standbyTransactions: state.standbyTransactions.filter((tx) => {
          /**
           * - ignore empty hashes as there's no way to compare them
           * - ignore pending as it should only affect confirmed transactions that are already
           *   present in the paginated data
           */
          if (!tx.transactionHash || tx.status === TransactionStatus.Pending) return true

          return !confirmedTransactionsFromNewPage.includes(tx.transactionHash)
        }),
      }
    },

    updateFeedFirstPage: (state, action: PayloadAction<{ transactions: TokenTransaction[] }>) => ({
      ...state,
      feedFirstPage: [...action.payload.transactions],
    }),
  },

  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => {
      const persistedState: State = getRehydratePayload(action, 'transactions')
      const filtered = (persistedState.standbyTransactions || []).filter((tx) => tx.transactionHash)
      return {
        ...state,
        ...persistedState,
        standbyTransactions: filtered,
      }
    })
  },
})

export const {
  addStandbyTransaction,
  transactionConfirmed,
  updateTransactions,
  removeDuplicatedStandByTransactions,
  updateFeedFirstPage,
} = slice.actions

export const { actions } = slice

export default slice.reducer
