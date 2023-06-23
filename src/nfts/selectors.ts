import { RootState } from 'src/redux/reducers'

export const myNftsLoadingSelector = (state: RootState) => state.nfts.myNftsLoading

export const myNftsErrorSelector = (state: RootState) => state.nfts.myNftsError

export const myNftsSelector = (state: RootState) => state.nfts.myNfts
