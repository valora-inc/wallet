import { RootState } from 'src/redux/reducers'

export const jumpstartClaimStatusSelector = (state: RootState) => {
  return state.jumpstart.claimStatus
}

export const jumpstartSendStatusSelector = (state: RootState) => {
  return state.jumpstart.depositStatus
}

export const jumpstartReclaimStatusSelector = (state: RootState) => {
  return state.jumpstart.reclaimStatus
}
