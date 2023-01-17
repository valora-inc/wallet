import { RootState } from 'src/redux/reducers'

export const getNetworkConnected = (state: RootState) => state.networkInfo.connected

export const isAppConnected = (state: RootState) => getNetworkConnected(state)

// isAppConnected is used to either show the "disconnected banner" or "Refresh balance"
// but not both at the same time
export const shouldUpdateBalance = (state: RootState) => isAppConnected(state)
