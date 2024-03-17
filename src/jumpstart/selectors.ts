import { RootState } from 'src/redux/reducers'

export const showJumstartClaimLoading = (state: RootState) => {
  return state.jumpstart.claimStatus === 'loading'
}

export const showJumstartClaimError = (state: RootState) => {
  return state.jumpstart.claimStatus === 'error'
}

export const jumpstartSendStatusSelector = (state: RootState) => {
  return state.jumpstart.depositStatus
}
