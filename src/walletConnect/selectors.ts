import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'

export function selectHasPendingState(state: RootState) {
  return (
    state.walletConnect.pendingActions.length > 0 || state.walletConnect.pendingSessions.length > 0
  )
}

export const sessionsSelector = (state: RootState) => state.walletConnect.sessions
const pendingSessionsSelector = (state: RootState) => state.walletConnect.pendingSessions

export const selectSessions = createSelector(
  [sessionsSelector, pendingSessionsSelector],
  (sessions, pending) => {
    return {
      pending,
      sessions,
    }
  }
)

export function selectPendingActions(state: RootState) {
  return state.walletConnect.pendingActions
}
