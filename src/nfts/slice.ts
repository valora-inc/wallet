import { createSlice } from '@reduxjs/toolkit'
import { Nft } from 'src/nfts/types'

export interface FetchNftsCompleted {
  nfts: Nft[]
}

export interface State {
  nftsLoading: boolean
  nftsError: string | null
  nfts: Nft[]
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
    fetchNftsCompleted: (state, action) => {
      state.nftsLoading = false
      state.nfts = action.payload
    },
    fetchNftsFailed: (state, action) => {
      state.nftsLoading = false
      state.nftsError = action.payload.error
    },
  },
})

export const { fetchNfts, fetchNftsCompleted, fetchNftsFailed } = slice.actions

export default slice.reducer
