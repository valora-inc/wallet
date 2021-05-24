import { RootState } from 'src/redux/reducers'

export function selectSessions(state: RootState) {
  return {
    pending: state.walletConnect.pendingSessions,
    sessions: state.walletConnect.sessions,
  }
}

export function selectPendingActions(state: RootState) {
  return state.walletConnect.pendingActions
}

export function selectHasPendingState(state: RootState) {
  return (
    state.walletConnect.pendingSessions.length > 0 || state.walletConnect.pendingActions.length > 0
  )
}
