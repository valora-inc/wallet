import BigNumber from 'bignumber.js'
import InAppReview from 'react-native-in-app-review'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { setAppReview } from 'src/appReview/saga'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { Actions as SendActions } from 'src/send/actions'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

const mockIsAvailable = jest.fn()
jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: jest.fn(),
  isAvailable: () => mockIsAvailable(),
}))

describe(setAppReview, () => {
  it.each`
    lastInteractionTimestamp                 | lastInteraction
    ${null}                                  | ${null}
    ${Date.now() - 1000 * 60 * 60 * 24 * 92} | ${'92 days ago'}
  `(
    `Should show when isAvailable: true and lastInteraction: $lastInteraction`,
    async ({ lastInteractionTimestamp }) => {
      jest.clearAllMocks()
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
    lastInteractionTimestamp                 | isAvailable | lastInteraction
    ${Date.now() - ONE_DAY_IN_MILLIS}        | ${true}     | ${'1 day ago'}
    ${null}                                  | ${false}    | ${null}
    ${Date.now() - 1000 * 60 * 60 * 24 * 92} | ${false}    | ${'92 days ago'}
    ${Date.now() - ONE_DAY_IN_MILLIS}        | ${false}    | ${'1 day ago'}
  `(
    `Should not show when isAvailable: $isAvailable and Last Interaction: $lastInteraction`,
    async ({ lastInteractionTimestamp, isAvailable }) => {
      // Clear previous calls
      jest.clearAllMocks()
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
