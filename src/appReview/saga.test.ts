import BigNumber from 'bignumber.js'
import InAppReview from 'react-native-in-app-review'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { requestInAppReview } from 'src/appReview/saga'
import { lastInteractionTimestampSelector } from 'src/appReview/selectors'
import { Actions as SendActions } from 'src/send/actions'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { createMockStore } from 'test/utils'

const mockIsAvailable = jest.fn()
jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: jest.fn(),
  isAvailable: () => mockIsAvailable(),
}))

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
      mockIsAvailable.mockReturnValue(true)
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

      expect(InAppReview.RequestInAppReview).toHaveBeenCalledTimes(1)
    }
  )

  it.each`
    lastInteractionTimestamp | isAvailable | lastInteraction  | walletAddress
    ${oneDayAgo}             | ${true}     | ${'1 day ago'}   | ${'0xTest'}
    ${null}                  | ${false}    | ${null}          | ${'0xTest'}
    ${oneQuarterAgo}         | ${false}    | ${'92 days ago'} | ${'0xTest'}
    ${oneDayAgo}             | ${false}    | ${'1 day ago'}   | ${'0xTest'}
    ${oneDayAgo}             | ${true}     | ${'1 day ago'}   | ${null}
    ${null}                  | ${false}    | ${null}          | ${null}
    ${oneQuarterAgo}         | ${false}    | ${'92 days ago'} | ${null}
    ${oneDayAgo}             | ${false}    | ${'1 day ago'}   | ${null}
  `(
    `Should not show when isAvailable: $isAvailable, Last Interaction: $lastInteraction and Wallet Address: $walletAddress`,
    async ({ lastInteractionTimestamp, isAvailable, walletAddress }) => {
      // Clear previous calls
      jest.clearAllMocks()
      mockIsAvailable.mockReturnValue(isAvailable)

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

      expect(InAppReview.RequestInAppReview).not.toHaveBeenCalled()
    }
  )
})
