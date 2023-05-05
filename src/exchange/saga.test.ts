import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { Actions, WithdrawCeloAction, withdrawCeloCanceled } from 'src/exchange/actions'
import { withdrawCelo } from 'src/exchange/saga'
import { getConnectedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'

const account = '0x22c8a9178841ba95a944afd1a1faae517d3f5daa'

describe(withdrawCelo, () => {
  it('fails if user cancels PIN input', async () => {
    const mockAddress = '0x1234'
    const withdrawCeloAction: WithdrawCeloAction = {
      type: Actions.WITHDRAW_CELO,
      amount: new BigNumber(10),
      recipientAddress: mockAddress,
      isCashOut: false,
    }
    await expectSaga(withdrawCelo, withdrawCeloAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(withdrawCeloCanceled())
      .run()
  })
})
