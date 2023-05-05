import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { AppReviewEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { requestInAppReview } from 'src/appReview/saga'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { Actions as SendActions } from 'src/send/actions'
import { getFeatureGate } from 'src/statsig'
import Logger from 'src/utils/Logger'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { createMockStore } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')
jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: () => mockRequestInAppReview(),
  isAvailable: () => mockIsAvailable(),
}))

const mockIsAvailable = jest.fn()
const mockRequestInAppReview = jest.fn()
const loggerErrorSpy = jest.spyOn(Logger, 'error')

const oneDayAgo = Date.now() - ONE_DAY_IN_MILLIS
const oneQuarterAgo = Date.now() - ONE_DAY_IN_MILLIS * 92

describe(requestInAppReview, () => {
  it.each`
    lastInteractionTimestamp | lastInteraction
    ${null}                  | ${null}
    ${oneQuarterAgo}         | ${'92 days ago'}
  `(
    `Should show when isAvailable: true, Last Interaction: $lastInteraction and Wallet Address: 0xTest`,
    async ({ lastInteractionTimestamp }) => {
      jest.clearAllMocks()
      mocked(getFeatureGate).mockReturnValue(true)
      mockIsAvailable.mockReturnValue(true)
      mockRequestInAppReview.mockResolvedValue(true)

      await expectSaga(requestInAppReview)
        .withState(
          createMockStore({
            web3: { account: '0xTest' },
          }).getState()
        )
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
    lastInteractionTimestamp | isAvailable | lastInteraction  | featureGate | walletAddress
    ${oneDayAgo}             | ${true}     | ${'1 day ago'}   | ${true}     | ${'0xTest'}
    ${null}                  | ${false}    | ${null}          | ${true}     | ${'0xTest'}
    ${oneQuarterAgo}         | ${false}    | ${'92 days ago'} | ${true}     | ${'0xTest'}
    ${oneDayAgo}             | ${false}    | ${'1 day ago'}   | ${true}     | ${'0xTest'}
    ${oneDayAgo}             | ${true}     | ${'1 day ago'}   | ${false}    | ${'0xTest'}
    ${null}                  | ${false}    | ${null}          | ${false}    | ${'0xTest'}
    ${oneQuarterAgo}         | ${false}    | ${'92 days ago'} | ${false}    | ${'0xTest'}
    ${oneDayAgo}             | ${false}    | ${'1 day ago'}   | ${false}    | ${'0xTest'}
    ${oneDayAgo}             | ${true}     | ${'1 day ago'}   | ${true}     | ${null}
    ${null}                  | ${false}    | ${null}          | ${true}     | ${null}
    ${oneQuarterAgo}         | ${false}    | ${'92 days ago'} | ${true}     | ${null}
    ${oneDayAgo}             | ${false}    | ${'1 day ago'}   | ${true}     | ${null}
    ${oneDayAgo}             | ${true}     | ${'1 day ago'}   | ${false}    | ${null}
    ${null}                  | ${false}    | ${null}          | ${false}    | ${null}
    ${oneQuarterAgo}         | ${false}    | ${'92 days ago'} | ${false}    | ${null}
    ${oneDayAgo}             | ${false}    | ${'1 day ago'}   | ${false}    | ${null}
  `(
    `Should not show when Device Available: $isAvailable, Feature Gate: $featureGate, Last Interaction: $lastInteraction and Wallet Address: $walletAddress`,
    async ({ lastInteractionTimestamp, isAvailable, featureGate, walletAddress }) => {
      // Clear previous calls
      jest.clearAllMocks()
      mocked(getFeatureGate).mockReturnValue(featureGate)
      mockIsAvailable.mockReturnValue(isAvailable)
      mockRequestInAppReview.mockResolvedValue(true)

      await expectSaga(requestInAppReview)
        .withState(
          createMockStore({
            web3: { account: walletAddress },
          }).getState()
        )
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

    await expectSaga(requestInAppReview)
      .withState(
        createMockStore({
          web3: { account: '0xTest' },
        }).getState()
      )
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
    expect(loggerErrorSpy).toHaveBeenLastCalledWith(
      'appReview/saga',
      'Error while calling InAppReview.RequestInAppReview',
      new Error('🤖💥')
    )
  })
})
