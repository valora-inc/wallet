import { RootState } from 'src/redux/reducers'

export function selectSessions(state: RootState) {
  return {
    pending: state.walletConnect.v2.pendingSessions,
    sessions: state.walletConnect.v2.sessions,
  }
}

export function selectPendingActions(state: RootState) {
  return state.walletConnect.v2.pendingActions
}

export function selectHasPendingState(state: RootState) {
  return (
    state.walletConnect.v2.pendingSessions.length > 0 ||
    state.walletConnect.v2.pendingActions.length > 0
  )
}
