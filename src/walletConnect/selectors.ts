import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'

export function selectHasPendingState(state: RootState) {
  return (
    state.walletConnect.pendingActions.length > 0 || state.walletConnect.pendingSessions.length > 0
  )
}

export const selectSessions = createSelector(
  [
    (state: RootState) => state.walletConnect.pendingSessions,
    (state: RootState) => state.walletConnect.sessions,
  ],
  (pending, sessions) => ({
    pending,
    sessions,
  })
)

export function selectPendingActions(state: RootState) {
  return state.walletConnect.pendingActions
}

export function selectSessionFromTopic(topic: string) {
  return function (state: RootState) {
    return state.walletConnect.sessions.find((session) => session.topic === topic)
  }
}
