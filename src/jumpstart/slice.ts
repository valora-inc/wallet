import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TokenBalance } from 'src/tokens/slice'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export interface JumpstartTransactionStartedAction {
  serializablePreparedTransactions: SerializableTransactionRequest[]
  sendToken: TokenBalance
  sendAmount: string
}
interface State {
  claimStatus: 'idle' | 'loading' | 'error'
  depositStatus: 'idle' | 'loading' | 'error' | 'success'
}

const initialState: State = {
  claimStatus: 'idle',
  depositStatus: 'idle',
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

    jumpstartLoadingDismissed: (state) => ({
      ...state,
      claimStatus: 'idle',
    }),

    jumpstartErrorDismissed: (state) => ({
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
    depositTransactionCancelled: (state) => ({
      ...state,
      depositStatus: 'idle',
    }),
  },
})

export const {
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
  jumpstartClaimFailed,
  jumpstartLoadingDismissed,
  jumpstartErrorDismissed,
  depositTransactionFlowStarted,
  depositTransactionStarted,
  depositTransactionSucceeded,
  depositTransactionFailed,
  depositTransactionCancelled,
} = slice.actions

export default slice.reducer
