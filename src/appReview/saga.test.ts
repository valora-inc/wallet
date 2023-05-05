import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { AppReviewEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setAppReview } from 'src/appReview/saga'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { Actions as SendActions } from 'src/send/actions'
import { getFeatureGate } from 'src/statsig'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { mocked } from 'ts-jest/utils'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')
jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: () => mockRequestInAppReview(),
  isAvailable: () => mockIsAvailable(),
}))

const mockIsAvailable = jest.fn()
const mockRequestInAppReview = jest.fn()

describe(setAppReview, () => {
  it.each`
    lastInteractionTimestamp                 | lastInteraction
    ${null}                                  | ${null}
    ${Date.now() - 1000 * 60 * 60 * 24 * 92} | ${'92 days ago'}
  `(
    `Should show when Device Available: true and Last Interaction: $lastInteraction`,
    async ({ lastInteractionTimestamp }) => {
      jest.clearAllMocks()
      mocked(getFeatureGate).mockReturnValue(true)
      mockIsAvailable.mockReturnValue(true)
      mockRequestInAppReview.mockResolvedValue(true)

      await expectSaga(setAppReview)
        .provide([[select(lastInteractionTimestampSelector), lastInteractionTimestamp]])
        .dispatch({
          type: SendActions.SEND_PAYMENT_SUCCESS,
          payload: { amount: new BigNumber('100') },
        })
        .run()

      expect(mockRequestInAppReview).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppReviewEvents.app_review_impression)
    }
  )

  it.each`
    lastInteractionTimestamp                 | isAvailable | lastInteraction  | featureGate
    ${Date.now() - ONE_DAY_IN_MILLIS}        | ${true}     | ${'1 day ago'}   | ${true}
    ${null}                                  | ${false}    | ${null}          | ${true}
    ${Date.now() - 1000 * 60 * 60 * 24 * 92} | ${false}    | ${'92 days ago'} | ${true}
    ${Date.now() - ONE_DAY_IN_MILLIS}        | ${false}    | ${'1 day ago'}   | ${true}
    ${Date.now() - ONE_DAY_IN_MILLIS}        | ${true}     | ${'1 day ago'}   | ${false}
    ${null}                                  | ${false}    | ${null}          | ${false}
    ${Date.now() - 1000 * 60 * 60 * 24 * 92} | ${false}    | ${'92 days ago'} | ${false}
    ${Date.now() - ONE_DAY_IN_MILLIS}        | ${false}    | ${'1 day ago'}   | ${false}
  `(
    `Should not show when Device Available: $isAvailable, Feature Gate: $featureGate and Last Interaction: $lastInteraction`,
    async ({ lastInteractionTimestamp, isAvailable, featureGate }) => {
      // Clear previous calls
      jest.clearAllMocks()
      mocked(getFeatureGate).mockReturnValue(featureGate)
      mockIsAvailable.mockReturnValue(isAvailable)
      mockRequestInAppReview.mockResolvedValue(true)

      await expectSaga(setAppReview)
        .provide([[select(lastInteractionTimestampSelector), lastInteractionTimestamp]])
        .dispatch({
          type: SendActions.SEND_PAYMENT_SUCCESS,
          payload: { amount: new BigNumber('100') },
        })
        .run()

      expect(mockRequestInAppReview).not.toHaveBeenCalled()
      expect(ValoraAnalytics.track).not.toHaveBeenCalled()
    }
  )

  it('Should handle error from react-native-in-app-review', async () => {
    jest.clearAllMocks()
    mocked(getFeatureGate).mockReturnValue(true)
    mockIsAvailable.mockReturnValue(true)
    mockRequestInAppReview.mockRejectedValue(new Error('🤖💥'))

    await expectSaga(setAppReview)
      .provide([[select(lastInteractionTimestampSelector), null]])
      .dispatch({
        type: SendActions.SEND_PAYMENT_SUCCESS,
        payload: { amount: new BigNumber('100') },
      })
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppReviewEvents.app_review_error, {
      error: '🤖💥',
    })
  })
})
