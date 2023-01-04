import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Actions, EscrowReclaimPaymentAction } from 'src/escrow/actions'
import { reclaimFromEscrow } from 'src/escrow/saga'
import { getConnectedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'
import { mockAccount } from 'test/values'

describe(reclaimFromEscrow, () => {
  it('fails if user cancels PIN input', async () => {
    const reclaimEscrowAction: EscrowReclaimPaymentAction = {
      type: Actions.RECLAIM_PAYMENT,
      paymentID: 'Payment ID',
    }
    await expectSaga(reclaimFromEscrow, reclaimEscrowAction)
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })
})
