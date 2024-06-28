import { RootState } from 'src/redux/store'

export const depositStatusSelector = (state: RootState) => state.earn.depositStatus

export const withdrawStatusSelector = (state: RootState) => state.earn.withdrawStatus

export const poolInfoFetchStatusSelector = (state: RootState) => state.earn.poolInfoFetchStatus

export const poolInfoSelector = (state: RootState) => state.earn.poolInfo
