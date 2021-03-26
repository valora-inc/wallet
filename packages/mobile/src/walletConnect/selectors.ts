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
