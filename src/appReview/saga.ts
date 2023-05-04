import InAppReview from 'react-native-in-app-review'
import { call, put, select, spawn, takeLatest, takeLeading } from 'redux-saga/effects'
import { appReviewSelector } from 'src/appReview/selectors'
import { setInitialized, setLastInteractionTimestamp } from 'src/appReview/slice'
import { Actions as SendActions } from 'src/send/actions'
import { safely } from 'src/utils/safely'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { Actions as Web3Actions } from 'src/web3/actions'

export function* initAppReview() {
  const { inAppRatingSupported, initialized } = yield select(appReviewSelector)
  // Quick Return if we have already initialized or if the device does not support in app rating
  if (initialized || !inAppRatingSupported) return
  yield put(setInitialized(true))
}

export function* setAppReview() {
  const { inAppRatingSupported, initialized, lastInteractionTimestamp } = yield select(
    appReviewSelector
  )

  // Quick Return & check if we should show the review prompt
  // if the device does not support in app review
  // or we have not initialized
  // or less than 7 days since last interaction
  if (
    !inAppRatingSupported ||
    !initialized ||
    lastInteractionTimestamp > Date.now() - ONE_DAY_IN_MILLIS * 7
  ) {
    return
  }

  // Will return true when the in-app review dialog is shown
  const result = yield call(InAppReview.RequestInAppReview)
  if (result) yield put(setLastInteractionTimestamp(Date.now()))
}

export function* watchAppReview() {
  // TODO: add more actions to trigger app review
  yield takeLeading([Web3Actions.SET_ACCOUNT], safely(initAppReview))
  yield takeLatest([SendActions.SEND_PAYMENT_SUCCESS], safely(setAppReview))
}

export function* appReviewSaga() {
  yield spawn(watchAppReview)
}
