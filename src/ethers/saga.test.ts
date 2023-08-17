import { CeloTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getSendTxFeeDetails } from 'src/ethers/saga'
import { buildSendTx } from 'src/send/saga'
import { chooseTxFeeDetails } from 'src/transactions/send'
import { mockFeeInfo } from 'test/values'

describe('getSendTxFeeDetails', () => {
  it('calls buildSendTx and chooseTxFeeDetails with the expected values', async () => {
    const recipientAddress = '0x1234'
    const amount = new BigNumber(10)
    const tokenAddress = '0x12345'
    const feeInfo = mockFeeInfo
    const celoTx = {
      txo: 'test',
    } as unknown as CeloTransactionObject<unknown>
    const encryptedComment = 'test'

    const expectedFeeDetails = {
      feeCurrency: feeInfo.feeCurrency,
      gas: feeInfo.gas,
      gasPrice: feeInfo.gasPrice,
    }

    await expectSaga(getSendTxFeeDetails, {
      recipientAddress,
      amount,
      tokenAddress,
      feeInfo,
      encryptedComment,
    })
      .provide([
        [call(buildSendTx, tokenAddress, amount, recipientAddress, encryptedComment), celoTx],
      ])
      .provide([
        [
          call(
            chooseTxFeeDetails,
            celoTx.txo,
            feeInfo.feeCurrency,
            feeInfo.gas.toNumber(),
            feeInfo.gasPrice
          ),
          expectedFeeDetails,
        ],
      ])
      .returns(expectedFeeDetails)
  })
})
