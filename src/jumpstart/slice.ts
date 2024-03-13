import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TokenBalance } from 'src/tokens/slice'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export interface SendJumpstartTransactionAction {
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
    depositTransactionStarted: (state, _action: PayloadAction<SendJumpstartTransactionAction>) => ({
      ...state,
      depositStatus: 'loading',
    }),
    depositTransactionSuccessful: (state) => ({
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
    depositTransactionCompleted: (state) => ({
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
  depositTransactionStarted,
  depositTransactionSuccessful,
  depositTransactionFailed,
  depositTransactionCancelled,
  depositTransactionCompleted,
} = slice.actions

export default slice.reducer
