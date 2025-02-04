import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { NftWithNetworkId } from 'src/nfts/types'

export interface FetchNftsCompletedAction {
  nfts: NftWithNetworkId[]
}

export interface FetchNftsFailedAction {
  error: string
}

type State = {
  nftsLoading: boolean
  nftsError: string | null
  nfts: NftWithNetworkId[]
}

const initialState: State = {
  nftsLoading: false,
  nftsError: null,
  nfts: [],
}

export const slice = createSlice({
  name: 'nfts',
  initialState,
  reducers: {
    fetchNfts: (state) => {
      state.nftsLoading = true
      state.nftsError = null
    },
    fetchNftsCompleted: (state, action: PayloadAction<FetchNftsCompletedAction>) => {
      state.nftsLoading = false
      state.nfts = action.payload.nfts
    },
    fetchNftsFailed: (state, action: PayloadAction<FetchNftsFailedAction>) => {
      state.nftsLoading = false
      state.nftsError = action.payload.error
    },
  },
})

export const { fetchNfts, fetchNftsCompleted, fetchNftsFailed } = slice.actions

export default slice.reducer
