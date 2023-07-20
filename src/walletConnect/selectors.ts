import { RootState } from 'src/redux/reducers'

export function selectHasPendingState(state: RootState) {
  return (
    state.walletConnect.pendingActions.length > 0 || state.walletConnect.pendingSessions.length > 0
  )
}

export function selectSessions(state: RootState) {
  return {
    pending: state.walletConnect.pendingSessions,
    sessions: state.walletConnect.sessions,
  }
}

export function selectPendingActions(state: RootState) {
  return state.walletConnect.pendingActions
}

export function selectSessionFromTopic(topic: string) {
  return function (state: RootState) {
    return state.walletConnect.sessions.find((session) => session.topic === topic)
  }
}
