import { RootState } from 'src/redux/reducers'

export const showJumstartLoading = (state: RootState) => {
  return state.jumpstart.claimStatus === 'loading'
}

export const showJumstartError = (state: RootState) => {
  return state.jumpstart.claimStatus === 'error'
}
