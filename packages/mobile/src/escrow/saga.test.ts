import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ESCROW_PAYMENT_EXPIRY_SECONDS } from 'src/config'
import {
  Actions,
  EscrowReclaimPaymentAction,
  EscrowTransferPaymentAction,
  fetchSentEscrowPayments,
} from 'src/escrow/actions'
import {
  reclaimFromEscrow,
  registerStandbyTransaction,
  registerStandbyTransactionLegacy,
  transferToEscrow,
} from 'src/escrow/saga'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { getERC20TokenContract } from 'src/tokens/saga'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { getContractKitAsync } from 'src/web3/contracts'
import {
  getConnectedAccount,
  getConnectedUnlockedAccount,
  unlockAccount,
  UnlockResult,
} from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockContract,
  mockCusdAddress,
  mockE164Number,
  mockE164NumberHash,
  mockE164NumberPepper,
} from 'test/values'

describe(transferToEscrow, () => {
  it('transfers successfully if all parameters are right', async () => {
    const kit = await getContractKitAsync()
    const escrowContract = await kit.contracts.getEscrow()
    const phoneHashDetails: PhoneNumberHashDetails = {
      e164Number: mockE164Number,
      phoneHash: mockE164NumberHash,
      pepper: mockE164NumberPepper,
    }
    const escrowTransferAction: EscrowTransferPaymentAction = {
      type: Actions.TRANSFER_PAYMENT,
      phoneHashDetails,
      amount: new BigNumber(10),
      tokenAddress: mockCusdAddress,
      context: newTransactionContext('Escrow', 'Transfer'),
    }
    await expectSaga(transferToEscrow, escrowTransferAction)
      .withState(createMockStore().getState())
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(getERC20TokenContract, mockCusdAddress), mockContract],
        [matchers.call.fn(sendTransaction), true],
        [matchers.call.fn(sendAndMonitorTransaction), { receipt: true, error: undefined }],
      ])
      .put(fetchSentEscrowPayments())
      .call(
        registerStandbyTransactionLegacy,
        escrowTransferAction.context,
        '10',
        escrowContract.address
      )
      .call(
        registerStandbyTransaction,
        escrowTransferAction.context,
        '-10',
        mockCusdAddress,
        escrowContract.address
      )
      .run()
    expect(mockContract.methods.approve).toHaveBeenCalledWith(
      escrowContract.address,
      '10000000000000000000'
    )
    expect(escrowContract.transfer).toHaveBeenCalledWith(
      mockE164NumberHash,
      mockCusdAddress,
      '10000000000000000000',
      ESCROW_PAYMENT_EXPIRY_SECONDS,
      expect.any(String),
      NUM_ATTESTATIONS_REQUIRED
    )
  })

  it('fails if user cancels PIN input', async () => {
    const phoneHashDetails: PhoneNumberHashDetails = {
      e164Number: mockE164Number,
      phoneHash: mockE164NumberHash,
      pepper: mockE164NumberPepper,
    }
    const escrowTransferAction: EscrowTransferPaymentAction = {
      type: Actions.TRANSFER_PAYMENT,
      phoneHashDetails,
      amount: new BigNumber(10),
      tokenAddress: mockCusdAddress,
      context: newTransactionContext('Escrow', 'Transfer'),
    }
    await expectSaga(transferToEscrow, escrowTransferAction)
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })
})

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
