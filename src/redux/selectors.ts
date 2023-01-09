import { BALANCE_OUT_OF_SYNC_THRESHOLD } from 'src/config'
import { RootState } from 'src/redux/reducers'
import { timeDeltaInSeconds } from 'src/utils/time'

export const getNetworkConnected = (state: RootState) => state.networkInfo.connected

export const isAppConnected = (state: RootState) => getNetworkConnected(state)

export const celoTokenLastFetch = (state: RootState) => state.goldToken.lastFetch || 0

export const lastFetchTooOld = (lastFetch: number) => {
  // if lastFetch is null, then skip
  return !!lastFetch && timeDeltaInSeconds(Date.now(), lastFetch) > BALANCE_OUT_OF_SYNC_THRESHOLD
}

export const isCeloTokenBalanceStale = (state: RootState) =>
  lastFetchTooOld(celoTokenLastFetch(state))

export const areAllBalancesStale = (state: RootState) => isCeloTokenBalanceStale(state)

// isAppConnected is used to either show the "disconnected banner" or "Refresh balance"
// but not both at the same time
export const shouldUpdateBalance = (state: RootState) =>
  areAllBalancesStale(state) && isAppConnected(state)
