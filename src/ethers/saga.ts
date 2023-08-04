import BigNumber from 'bignumber.js'
import { FeeInfo } from 'src/fees/saga'
import { buildSendTx } from 'src/send/saga'
import { chooseTxFeeDetails } from 'src/transactions/send'
import { call } from 'typed-redux-saga'

// Helper function to call chooseTxFeeDetails for send transactions (aka transfer contract calls)
// using parameters that are not specific to contractkit
export function* getSendTxFeeDetails({
  recipientAddress,
  amount,
  tokenAddress,
  feeInfo,
  encryptedComment,
}: {
  recipientAddress: string
  amount: BigNumber
  tokenAddress: string
  feeInfo: FeeInfo
  encryptedComment?: string
}) {
  const celoTx = yield* call(
    buildSendTx,
    tokenAddress,
    amount,
    recipientAddress,
    encryptedComment || ''
  )
  // todo(any): port this logic over from contractkit to use ethers
  const { feeCurrency, gas, gasPrice } = yield* call(
    chooseTxFeeDetails,
    celoTx.txo,
    feeInfo.feeCurrency,
    feeInfo.gas.toNumber(),
    feeInfo.gasPrice
  )
  return {
    feeCurrency,
    gas,
    gasPrice,
  }
}
