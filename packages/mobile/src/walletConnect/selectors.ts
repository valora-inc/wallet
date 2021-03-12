import { RootState } from 'src/redux/reducers'

export function pendingConnectionSelector(state: RootState) {
  return state.walletConnect.pendingConnections[0]
}

export function selectPendingSession(state: RootState) {
  console.log(state.walletConnect)
  return state.walletConnect.pendingSessions[0]
}

export function selectPendingConnection(state: RootState) {
  return state.walletConnect.pendingConnections[0]
}

export function getSessions(state: RootState) {
  return state.walletConnect.sessions
}

export function getPendingRequests(state: RootState) {
  return state.walletConnect.pendingActions
}

export function walletConnectClientSelector(state: RootState) {
  return state.walletConnect.client
}
