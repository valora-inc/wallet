import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId, TokenAmount } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Address, Hash } from 'viem'

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
  beneficiaryAddress: Address
}

interface DepositTransactionSucceededAction {
  liveLinkType: 'erc20'
  beneficiaryAddress: Address
  transactionHash: Hash
  networkId: NetworkId
  tokenId: string
  amount: string
}

interface State {
  claimStatus: 'idle' | 'loading' | 'error' | 'errorAlreadyClaimed'
  depositStatus: 'idle' | 'loading' | 'error' | 'success'
  reclaimStatus: 'idle' | 'loading' | 'error' | 'success'
  introHasBeenSeen: boolean
}

const initialState: State = {
  claimStatus: 'idle',
  depositStatus: 'idle',
  reclaimStatus: 'idle',
  introHasBeenSeen: false,
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
    jumpstartClaimFailed: (state, action: PayloadAction<{ isAlreadyClaimed: boolean }>) => ({
      ...state,
      claimStatus: action.payload.isAlreadyClaimed ? 'errorAlreadyClaimed' : 'error',
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
    depositTransactionSucceeded: (
      state,
      _action: PayloadAction<DepositTransactionSucceededAction>
    ) => ({
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
    jumpstartIntroSeen: (state) => ({
      ...state,
      introHasBeenSeen: true,
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'jumpstart'),
      claimStatus: 'idle',
      depositStatus: 'idle',
      reclaimStatus: 'idle',
    }))
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
  jumpstartIntroSeen,
} = slice.actions

export default slice.reducer
