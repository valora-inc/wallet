import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId, TokenAmount } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export interface JumpstarReclaimAction {
  reclaimTx: SerializableTransactionRequest
  networkId: NetworkId
  tokenAmount: TokenAmount
  depositTxHash: string
}
export interface JumpstartTransactionStartedAction {
  serializablePreparedTransactions: SerializableTransactionRequest[]
  sendToken: TokenBalance
  sendAmount: string
}
interface State {
  claimStatus: 'idle' | 'loading' | 'error'
  depositStatus: 'idle' | 'loading' | 'error' | 'success'
  reclaimStatus: 'idle' | 'loading' | 'error' | 'success'
}

const initialState: State = {
  claimStatus: 'idle',
  depositStatus: 'idle',
  reclaimStatus: 'idle',
}

const slice = createSlice({
  name: 'jumpstart',
  initialState,
  reducers: {
    jumpstartClaimStarted: (state) => ({
      ...state,
      claimStatus: 'loading',
    }),

    jumpstartClaimSucceeded: (state) => ({
      ...state,
      claimStatus: 'idle',
    }),

    jumpstartClaimFailed: (state) => ({
      ...state,
      claimStatus: 'error',
    }),

    jumpstartClaimLoadingDismissed: (state) => ({
      ...state,
      claimStatus: 'idle',
    }),

    jumpstartClaimErrorDismissed: (state) => ({
      ...state,
      claimStatus: 'idle',
    }),
    depositTransactionFlowStarted: (state) => ({
      ...state,
      depositStatus: 'idle',
    }),
    depositTransactionStarted: (
      state,
      _action: PayloadAction<JumpstartTransactionStartedAction>
    ) => ({
      ...state,
      depositStatus: 'loading',
    }),
    depositTransactionSucceeded: (state) => ({
      ...state,
      depositStatus: 'success',
    }),
    depositTransactionFailed: (state) => ({
      ...state,
      depositStatus: 'error',
    }),
    depositErrorDismissed: (state) => ({
      ...state,
      depositStatus: 'idle',
    }),
    depositTransactionCancelled: (state) => ({
      ...state,
      depositStatus: 'idle',
    }),
    jumpstartReclaimFlowStarted: (state) => ({
      ...state,
      reclaimStatus: 'idle',
    }),
    jumpstartReclaimStarted: (state, _action: PayloadAction<JumpstarReclaimAction>) => ({
      ...state,
      reclaimStatus: 'loading',
    }),
    jumpstartReclaimSucceeded: (state) => ({
      ...state,
      reclaimStatus: 'success',
    }),
    jumpstartReclaimFailed: (state) => ({
      ...state,
      reclaimStatus: 'error',
    }),
    jumpstartReclaimErrorDismissed: (state) => ({
      ...state,
      reclaimStatus: 'idle',
    }),
  },
})

export const {
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
  jumpstartClaimFailed,
  jumpstartClaimLoadingDismissed,
  jumpstartClaimErrorDismissed,
  depositTransactionFlowStarted,
  depositTransactionStarted,
  depositTransactionSucceeded,
  depositTransactionFailed,
  depositErrorDismissed,
  depositTransactionCancelled,
  jumpstartReclaimFlowStarted,
  jumpstartReclaimStarted,
  jumpstartReclaimSucceeded,
  jumpstartReclaimFailed,
  jumpstartReclaimErrorDismissed,
} = slice.actions

export default slice.reducer
