import { createSlice } from '@reduxjs/toolkit'
import { Nft } from 'src/nfts/types'

export interface FetchMyNftsCompleted {
  nfts: Nft[]
}

export interface State {
  myNftsLoading: boolean
  myNftsError: string | null
  myNfts: Nft[]
}

const initialState: State = {
  myNftsLoading: false,
  myNftsError: null,
  myNfts: [],
}

export const slice = createSlice({
  name: 'nfts',
  initialState,
  reducers: {
    fetchMyNfts: (state) => {
      state.myNftsLoading = true
      state.myNftsError = null
    },
    fetchMyNftsCompleted: (state, action) => {
      state.myNftsLoading = false
      state.myNfts = action.payload
    },
    fetchMyNftsFailed: (state, action) => {
      state.myNftsLoading = false
      state.myNftsError = action.payload.error
    },
  },
})

export const { fetchMyNfts, fetchMyNftsCompleted, fetchMyNftsFailed } = slice.actions

export default slice.reducer
