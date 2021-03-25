import { RootState } from 'src/redux/reducers'

export function selectPendingSession(state: RootState) {
  return state.walletConnect.pendingSessions[0]
}

export function getSessions(state: RootState) {
  return state.walletConnect.sessions
}

export function getPendingRequests(state: RootState) {
  return state.walletConnect.pendingActions
}
