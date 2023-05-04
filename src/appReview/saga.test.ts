import BigNumber from 'bignumber.js'
import InAppReview from 'react-native-in-app-review'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { setAppReview } from 'src/appReview/saga'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { Actions as SendActions } from 'src/send/actions'
import { getFeatureGate } from 'src/statsig'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')
jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: jest.fn(),
  isAvailable: () => mockIsAvailable(),
}))

const mockIsAvailable = jest.fn()

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

      await expectSaga(setAppReview)
        .provide([[select(lastInteractionTimestampSelector), lastInteractionTimestamp]])
        .dispatch({
          type: SendActions.SEND_PAYMENT_SUCCESS,
          payload: { amount: new BigNumber('100') },
        })
        .run()

      expect(InAppReview.RequestInAppReview).toHaveBeenCalledTimes(1)
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

      await expectSaga(setAppReview)
        .provide([[select(lastInteractionTimestampSelector), lastInteractionTimestamp]])
        .dispatch({
          type: SendActions.SEND_PAYMENT_SUCCESS,
          payload: { amount: new BigNumber('100') },
        })
        .run()

      expect(InAppReview.RequestInAppReview).not.toHaveBeenCalled()
    }
  )
})
