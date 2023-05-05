import InAppReview from 'react-native-in-app-review'
import { call, put, select, spawn, takeLatest } from 'redux-saga/effects'
import { AppReviewEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { inAppReviewCalled } from 'src/appReview/slice'
import { Actions as SendActions } from 'src/send/actions'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'appReview/saga'
const REVIEW_INTERVAL = ONE_DAY_IN_MILLIS * 91

export function* requestInAppReview() {
  const walletAddress = yield select(walletAddressSelector)
  // Quick return if no wallet address or the device does not support in app review
  if (
    !walletAddress ||
    !InAppReview.isAvailable() ||
    !getFeatureGate({ featureGateName: StatsigFeatureGates.APP_REVIEW })
  )
    return

  const lastInteractionTimestamp = yield select(lastInteractionTimestampSelector)
  const now = Date.now()

  // If the last interaction was less than a quarter year ago or null
  if (now - lastInteractionTimestamp >= REVIEW_INTERVAL) {
    try {
      // If we call InAppReview.RequestInAppReview and there wasn't an error
      // Update the last interaction timestamp and send analytics
      yield call(InAppReview.RequestInAppReview)
      yield put(inAppReviewCalled(now))
      ValoraAnalytics.track(AppReviewEvents.app_review_impression)
    } catch (error) {
      Logger.error(TAG, `Error while calling InAppReview.RequestInAppReview`, error)
      ValoraAnalytics.track(AppReviewEvents.app_review_error, { error: error.message })
    }
  }
}

export function* watchAppReview() {
  // TODO: add more actions to trigger app review
  yield takeLatest([SendActions.SEND_PAYMENT_SUCCESS], safely(requestInAppReview))
}

export function* appReviewSaga() {
  yield spawn(watchAppReview)
}
