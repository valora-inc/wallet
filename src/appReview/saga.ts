import InAppReview from 'react-native-in-app-review'
import { call, put, select, spawn, takeLatest } from 'redux-saga/effects'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { setLastInteractionTimestamp } from 'src/appReview/slice'
import { Actions as SendActions } from 'src/send/actions'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { safely } from 'src/utils/safely'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

export function* setAppReview() {
  // Quick return if the device does not support in app review or app review is not enabled
  if (!InAppReview.isAvailable()) return
  if (!getFeatureGate({ featureGateName: StatsigFeatureGates.APP_REVIEW })) return

  const lastInteractionTimestamp = yield select(lastInteractionTimestampSelector)
  const now = Date.now()

  // If the last interaction was less than a quarter year ago or null
  if (lastInteractionTimestamp <= now - ONE_DAY_IN_MILLIS * 91) {
    const result = yield call(InAppReview.RequestInAppReview)
    // If the in app review was shown, update the last interaction timestamp
    if (result) yield put(setLastInteractionTimestamp(now))
  }
}

export function* watchAppReview() {
  // TODO: add more actions to trigger app review
  yield takeLatest([SendActions.SEND_PAYMENT_SUCCESS], safely(setAppReview))
}

export function* appReviewSaga() {
  yield spawn(watchAppReview)
}
