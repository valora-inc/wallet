import { call, select, spawn, take } from 'redux-saga/effects'
import { getCurrentUserTraits } from 'src/analytics/selectors'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

export function* updateUserTraits() {
  let prevTraits
  while (true) {
    const traits: ReturnType<typeof getCurrentUserTraits> = yield select(getCurrentUserTraits)
    if (traits !== prevTraits) {
      const { walletAddress } = traits
      yield call([ValoraAnalytics, 'identify'], walletAddress, traits)
      prevTraits = traits
    }

    yield take()
  }
}

export function* analyticsSaga() {
  yield spawn(updateUserTraits)
}
