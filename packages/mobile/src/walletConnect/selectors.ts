import { RootState } from 'src/redux/reducers'
import { selectHasPendingState as selectHasPendingStateV1 } from 'src/walletConnect/v1/selectors'
import { selectHasPendingState as selectHasPendingStateV2 } from 'src/walletConnect/v2/selectors'

export function selectHasPendingState(state: RootState) {
  return selectHasPendingStateV1(state) || selectHasPendingStateV2(state)
}
