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
  sendStatus: 'idle' | 'loading' | 'error' | 'success'
}

const initialState: State = {
  claimStatus: 'idle',
  sendStatus: 'idle',
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
      sendStatus: 'loading',
    }),
    depositTransactionSuccessful: (state) => ({
      ...state,
      sendStatus: 'success',
    }),
    depositTransactionFailed: (state) => ({
      ...state,
      sendStatus: 'error',
    }),
    depositTransactionCancelled: (state) => ({
      ...state,
      sendStatus: 'idle',
    }),
    depositTransactionCompleted: (state) => ({
      ...state,
      sendStatus: 'idle',
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
