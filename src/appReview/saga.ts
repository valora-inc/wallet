import InAppReview from 'react-native-in-app-review'
import { call, takeLatest } from 'redux-saga/effects'
import { Actions, initializeAppReview, updateAppReview } from 'src/appReview/actions'
import { safely } from 'src/utils/safely'

export function* initAppReview() {
  yield call(initializeAppReview)
}

export function* setAppReview() {
  const result = yield call(InAppReview.RequestInAppReview)
  yield call(updateAppReview, result)
}

export function* appReviewSaga() {
  yield takeLatest(Actions.INITIALIZE_APP_REVIEW, safely(initAppReview))
  yield takeLatest(Actions.UPDATE_APP_REVIEW, safely(setAppReview))
}
