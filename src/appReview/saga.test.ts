import BigNumber from 'bignumber.js'
import InAppReview from 'react-native-in-app-review'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { setAppReview } from 'src/appReview/saga'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { Actions as SendActions } from 'src/send/actions'

const mockIsAvailable = jest.fn()
jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: jest.fn(),
  isAvailable: () => mockIsAvailable(),
}))

describe(setAppReview, () => {
  it.each`
    lastInteractionTimestamp                 | shouldShowInAppReview | isAvailable | lastIteration
    ${null}                                  | ${true}               | ${true}     | ${null}
    ${Date.now() - 1000 * 60 * 60 * 24 * 92} | ${true}               | ${true}     | ${'92 days ago'}
    ${Date.now() - 1000}                     | ${false}              | ${true}     | ${'1 day ago'}
    ${null}                                  | ${false}              | ${false}    | ${null}
    ${Date.now() - 1000 * 60 * 60 * 24 * 92} | ${false}              | ${false}    | ${'92 days ago'}
    ${Date.now() - 1000}                     | ${false}              | ${false}    | ${'1 day ago'}
  `(
    `Should Show: $shouldShowInAppReview, Is Available: $isAvailable, Last Interaction: $lastIteration`,
    async ({ lastInteractionTimestamp, shouldShowInAppReview, isAvailable }) => {
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

      if (shouldShowInAppReview) {
        expect(InAppReview.RequestInAppReview).toHaveBeenCalledTimes(1)
      } else {
        expect(InAppReview.RequestInAppReview).not.toHaveBeenCalled()
      }
    }
  )
})
