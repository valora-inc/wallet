import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { SwapInfo } from 'src/swap/types'
import { NetworkId } from 'src/transactions/types'
import { Hash } from 'viem'

type SwapStatus = 'idle' | 'started' | 'success' | 'error'

interface SwapTask {
  id: string
  status: SwapStatus
}

interface SwapResult {
  swapId: string
  fromTokenId: string
  toTokenId: string
  transactionHash: Hash
  networkId: NetworkId
}

export interface State {
  currentSwap: SwapTask | null
  lastSwapped: string[]
}

const initialState: State = {
  currentSwap: null,
  lastSwapped: [],
}

function updateCurrentSwapStatus(currentSwap: SwapTask | null, swapId: string, status: SwapStatus) {
  if (!currentSwap || currentSwap.id !== swapId) {
    return
  }
  currentSwap.status = status
}

export function updateLastSwappedTokens(tokenIds: string[], newTokenIds: string[]) {
  const MAX_TOKEN_COUNT = 10

  const uniqueNewTokenIds = new Set(newTokenIds)
  const prevTokenIds = [...tokenIds]
  tokenIds.length = 0 // clear the array while keeping the reference

  for (const tokenId of prevTokenIds) {
    if (!uniqueNewTokenIds.has(tokenId)) {
      tokenIds.push(tokenId)
    }
  }

  tokenIds.push(...uniqueNewTokenIds)

  if (tokenIds.length > MAX_TOKEN_COUNT) {
    tokenIds.splice(0, tokenIds.length - MAX_TOKEN_COUNT)
  }
}

export const slice = createSlice({
  name: 'swap',
  initialState,
  reducers: {
    swapStart: (state, action: PayloadAction<SwapInfo>) => {
      state.currentSwap = {
        id: action.payload.swapId,
        status: 'started',
      }
    },
    swapSuccess: (state, action: PayloadAction<SwapResult>) => {
      const { swapId, fromTokenId, toTokenId } = action.payload
      updateCurrentSwapStatus(state.currentSwap, swapId, 'success')
      updateLastSwappedTokens(state.lastSwapped, [fromTokenId, toTokenId])
    },
    swapError: (state, action: PayloadAction<string>) => {
      updateCurrentSwapStatus(state.currentSwap, action.payload, 'error')
    },
    swapCancel: (state, action: PayloadAction<string>) => {
      updateCurrentSwapStatus(state.currentSwap, action.payload, 'idle')
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'swap'),
      currentSwap: null,
    }))
  },
})

export const { swapStart, swapSuccess, swapError, swapCancel } = slice.actions

export default slice.reducer
