import { RootState } from 'src/redux/reducers'

export function getWalletConnectClient(state: RootState) {
  return state.walletConnect.client
}

export function selectPendingSession(state: RootState) {
  console.log(state.walletConnect)
  // return state.walletConnect.sessions.find(s => )
}

export function getSessions(state: RootState) {
  return state.walletConnect.sessions
}

export function getPendingRequests(state: RootState) {
  return state.walletConnect.pendingActions
}
