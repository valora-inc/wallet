import BigNumber from 'bignumber.js'
import erc20 from 'src/abis/IERC20'
import stableToken from 'src/abis/StableToken'
import { FeeInfo } from 'src/fees/saga'
import { encryptComment } from 'src/identity/commentEncryption'
import { buildSendTx } from 'src/send/saga'
import { getTokenInfo, tokenAmountInSmallestUnit } from 'src/tokens/saga'
import { isStablecoin } from 'src/tokens/utils'
import { chooseTxFeeDetails } from 'src/transactions/send'
import { TransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { call } from 'typed-redux-saga'
import { SimulateContractReturnType, getAddress } from 'viem'

const TAG = 'viem/saga'

/**
 * Send a payment with viem. The equivalent of buildAndSendPayment in src/send/saga.
 *
 * @param options an object containing the arguments
 * @param options.context the transaction context
 * @param options.recipientAddress the address to send the payment to
 * @param options.amount the crypto amount to send
 * @param options.tokenAddress the crypto token address
 * @param options.comment the comment on the transaction
 * @param options.feeInfo an object containing the fee information
 * @returns
 */
export function* sendPayment({
  context,
  recipientAddress,
  amount,
  tokenAddress,
  comment,
  feeInfo,
}: {
  context: TransactionContext
  recipientAddress: string
  amount: BigNumber
  tokenAddress: string
  comment: string
  feeInfo: FeeInfo
}) {
  const wallet = yield* call(getViemWallet, networkConfig.viemChain.celo)

  Logger.debug(
    TAG,
    'Transferring token',
    context.description ?? 'No description',
    context.id,
    tokenAddress,
    amount,
    feeInfo
  )

  // TODO(satish): add standby transaction

  try {
    // this returns a method which is then passed to call instead of directly
    // doing yield* call(publicClient.celo.simulateContract, args) because this
    // results in a long TS error
    const simulateContractMethod = yield* call(getSimulateContractMethod, {
      wallet,
      tokenAddress,
      amount,
      recipientAddress,
      comment,
      feeInfo,
    })

    // Explicit type is specified here. The actual return type of this function is
    // something like
    // SimulateContractReturnType<typeof stableToken.abi, 'transferWithComment'>
    // | SimulateContractReturnType<typeof erc20.abi, 'transfer'>
    // but TSC doesn't like it when passed to writeContract
    const { request }: SimulateContractReturnType = yield* call(simulateContractMethod)

    const hash = yield* call([wallet, 'writeContract'], request)

    Logger.debug(TAG, 'Transaction successfully submitted. Hash:', hash)

    // TODO(satish): wait for receipt with a timeout, confirm tx and return

    return hash
  } catch (err) {
    Logger.warn(TAG, 'Transaction failed', err)
    throw err
  }
}

/**
 * Gets a function that invokes simulateContract for the appropriate contract
 * method based on the token. If the token is a stable token, it uses the
 * `transferWithComment` on the stable token contract, otherwise the `transfer`
 * method on the ERC20 contract
 *
 * @param options an object containing the arguments
 * @returns a function that invokes the simulateContract method
 */
function* getSimulateContractMethod({
  wallet,
  tokenAddress,
  amount,
  recipientAddress,
  comment,
  feeInfo,
}: {
  wallet: ViemWallet
  recipientAddress: string
  amount: BigNumber
  tokenAddress: string
  comment: string
  feeInfo: FeeInfo
}) {
  if (!wallet.account) {
    // this should never happen
    throw new Error('no account found in the wallet')
  }

  const tokenInfo = yield* call(getTokenInfo, tokenAddress)

  const convertedAmount = BigInt(yield* call(tokenAmountInSmallestUnit, amount, tokenAddress))

  if (isStablecoin(tokenInfo)) {
    const userAddress = wallet.account.address
    const encryptedComment = yield* call(
      encryptComment,
      comment,
      recipientAddress,
      userAddress,
      true
    )

    const { feeCurrency, gas, maxFeePerGas } = yield* call(getSendTxFeeDetails, {
      recipientAddress,
      amount,
      tokenAddress,
      feeInfo,
      encryptedComment: encryptedComment || '',
    })

    Logger.debug(TAG, 'Calling simulate contract for transferWithComment', {
      recipientAddress,
      convertedAmount,
      feeCurrency,
      gas,
      maxFeePerGas,
    })

    return () =>
      publicClient.celo.simulateContract({
        address: getAddress(tokenAddress),
        abi: stableToken.abi,
        functionName: 'transferWithComment',
        account: wallet.account,
        args: [getAddress(recipientAddress), convertedAmount, encryptedComment || ''],
        feeCurrency,
        gas,
        maxFeePerGas,
      })
  }

  const { feeCurrency, gas, maxFeePerGas } = yield* call(getSendTxFeeDetails, {
    recipientAddress,
    amount,
    tokenAddress,
    feeInfo,
  })

  Logger.debug(TAG, 'Calling simulate contract for transfer', {
    recipientAddress,
    convertedAmount,
    feeCurrency,
    gas,
    maxFeePerGas,
  })

  return () =>
    publicClient.celo.simulateContract({
      address: getAddress(tokenAddress),
      abi: erc20.abi,
      functionName: 'transfer',
      account: wallet.account,
      args: [getAddress(recipientAddress), convertedAmount],
      feeCurrency,
      gas,
      maxFeePerGas,
    })
}

/**
 * Helper function to call chooseTxFeeDetails for send transactions (aka
 * transfer contract calls) using parameters that are not specific to contractkit
 *
 * @param options the getSendTxFeeDetails options
 * @returns an object with the feeInfo compatible with viem
 */
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
  // TODO(ACT-926): port this logic over from contractkit to use viem
  const { feeCurrency, gas, gasPrice } = yield* call(
    chooseTxFeeDetails,
    celoTx.txo,
    feeInfo.feeCurrency,
    // gas and gasPrice can either be BigNumber or string. Since these are
    // stored in redux, BigNumbers are serialized as strings.
    // TODO(ACT-925): ensure type is consistent when fee is read from redux
    Number(feeInfo.gas),
    feeInfo.gasPrice
  )
  // Return fields in format compatible with viem
  return {
    feeCurrency: feeCurrency ? getAddress(feeCurrency) : undefined,
    gas: gas ? BigInt(gas) : undefined,
    maxFeePerGas: gasPrice ? BigInt(Number(gasPrice)) : undefined,
  }
}
