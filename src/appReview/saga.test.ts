import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { initAppReview, setAppReview } from 'src/appReview/saga'
import { appReviewSelector } from 'src/appReview/selectors'

jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: jest.fn(),
  isAvailable: jest.fn(),
}))

describe(initAppReview, () => {
  it('does nothing if inAppRatingSupported is false', () => {
    return expectSaga(initAppReview)
      .provide([[select(appReviewSelector), { inAppRatingSupported: false }]])
      .not.call.fn(call)
      .run()
  })

  it('does nothing if initialized is true', () => {
    return expectSaga(initAppReview)
      .provide([[select(appReviewSelector), { initialized: true }]])
      .not.call.fn(call)
      .run()
  })
})

describe(setAppReview, () => {
  it('does nothing if inAppRatingSupported is false', () => {
    return expectSaga(setAppReview)
      .provide([[select(appReviewSelector), { inAppRatingSupported: false }]])
      .not.call.fn(call)
      .run()
  })

  it('does nothing if initialized is false', () => {
    return expectSaga(setAppReview)
      .provide([[select(appReviewSelector), { initialized: false }]])
      .not.call.fn(call)
      .run()
  })

  it('does nothing if lastInteractionTimestamp is less than 7 days ago', () => {
    return expectSaga(setAppReview)
      .provide([[select(appReviewSelector), { lastInteractionTimestamp: Date.now() }]])
      .not.call.fn(call)
      .run()
  })
})
