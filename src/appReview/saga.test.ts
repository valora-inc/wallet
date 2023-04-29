import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { initializeAppReview, updateAppReview } from 'src/appReview/actions'
import { initAppReview, setAppReview } from 'src/appReview/saga'
import { appReviewSelector } from 'src/appReview/selectors'

jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: jest.fn(),
  isAvailable: jest.fn(),
}))

describe(initAppReview, () => {
  it('should be able to initialize appReview', async () => {
    await expectSaga(initAppReview).call(initializeAppReview).run()
  })
  it('should be able to update appReview', async () => {
    await expectSaga(setAppReview)
      .provide([
        [
          select(appReviewSelector),
          {
            isAvailable: true,
            appRated: false,
            lastInteractionTimestamp: null,
          },
        ],
        [call(updateAppReview), false],
      ])
      .run()
  })
})
