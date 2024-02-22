import { RootState } from 'src/redux/reducers'

export const showJumstartLoading = (state: RootState) => {
  return state.jumpstart.showLoading
}

export const showJumstartError = (state: RootState) => {
  return state.jumpstart.showError
}
