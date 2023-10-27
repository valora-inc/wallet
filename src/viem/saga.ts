import BigNumber from 'bignumber.js'
import erc20 from 'src/abis/IERC20'
import stableToken from 'src/abis/StableToken'
import { showError } from 'src/alert/actions'
import { TransactionEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FeeInfo } from 'src/fees/saga'
import { encryptComment } from 'src/identity/commentEncryption'
import { buildSendTx } from 'src/send/saga'
import { getTokenInfo, tokenAmountInSmallestUnit } from 'src/tokens/saga'
import { fetchTokenBalances } from 'src/tokens/slice'
import { getTokenId, isStablecoin } from 'src/tokens/utils'
import {
  addStandbyTransaction,
  removeStandbyTransaction,
  transactionConfirmed,
  transactionFailed,
} from 'src/transactions/actions'
import { chooseTxFeeDetails, wrapSendTransactionWithRetry } from 'src/transactions/send'
import { TokenTransactionTypeV2, TransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { unlockAccount } from 'src/web3/saga'
import { call, put } from 'typed-redux-saga'
import { SimulateContractReturnType, TransactionReceipt, getAddress } from 'viem'
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
  if (!wallet.account) {
    // this should never happen
    throw new Error('no account found in the wallet')
  }

  Logger.debug(
    TAG,
    'Transferring token',
    context.description ?? 'No description',
    context.id,
    tokenAddress,
    amount,
    feeInfo
  )

  try {
    // this returns a method which is then passed to call instead of directly
    // doing yield* call(publicClient.celo.simulateContract, args) because this
    // results in a long TS error
    const simulateContractMethod = yield* call(getTransferSimulateContract, {
      wallet,
      tokenAddress,
      amount,
      recipientAddress,
      comment,
      feeInfo,
    })

    const { request } = yield* call(simulateContractMethod)

    // unlock account before executing tx
    yield* call(unlockAccount, wallet.account.address)

    yield* put(
      addStandbyTransaction({
        __typename: 'TokenTransferV3',
        type: TokenTransactionTypeV2.Sent,
        context,
        networkId: networkConfig.defaultNetworkId,
        amount: {
          value: amount.negated().toString(),
          tokenAddress,
          tokenId: getTokenId(networkConfig.defaultNetworkId, tokenAddress),
        },
        address: recipientAddress,
        metadata: {
          comment,
        },
      })
    )

    const receipt = yield* call(sendAndMonitorTransaction, {
      context,
      wallet,
      // Cast for now otherwise TS complains about the type of request
      // TODO: investigate more and fix
      request: request as SimulateContractReturnType['request'],
    })
    return receipt
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
function* getTransferSimulateContract({
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

  const encryptedComment = isStablecoin(tokenInfo)
    ? yield* call(encryptComment, comment, recipientAddress, wallet.account.address, true)
    : undefined

  const feeFields = yield* call(getSendTxFeeDetails, {
    recipientAddress,
    amount,
    tokenAddress,
    feeInfo,
    encryptedComment: encryptedComment || '',
  })

  if (isStablecoin(tokenInfo)) {
    Logger.debug(TAG, 'Calling simulate contract for transferWithComment with new fee fields', {
      recipientAddress,
      convertedAmount,
      feeCurrency: feeFields.feeCurrency,
      gas: feeFields.gas?.toString(),
      maxFeePerGas: feeFields.maxFeePerGas?.toString(),
    })

    return () =>
      publicClient.celo.simulateContract({
        address: getAddress(tokenAddress),
        abi: stableToken.abi,
        functionName: 'transferWithComment',
        account: wallet.account,
        args: [getAddress(recipientAddress), convertedAmount, encryptedComment || ''],
        ...feeFields,
      })
  }

  Logger.debug(TAG, 'Calling simulate contract for transfer with new fee fields', {
    recipientAddress,
    convertedAmount,
    feeCurrency: feeFields.feeCurrency,
    gas: feeFields.gas?.toString(),
    maxFeePerGas: feeFields.maxFeePerGas?.toString(),
  })

  return () =>
    publicClient.celo.simulateContract({
      address: getAddress(tokenAddress),
      abi: erc20.abi,
      functionName: 'transfer',
      account: wallet.account,
      args: [getAddress(recipientAddress), convertedAmount],
      ...feeFields,
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
    // Don't include the feeCurrency field if not present. Otherwise viem throws
    // saying feeCurrency is required for CIP-42 transactions. Not setting the
    // field at all bypasses this check and the tx succeeds with fee paid with
    // CELO.
    ...(feeCurrency && { feeCurrency: getAddress(feeCurrency) }),
    gas: gas ? BigInt(gas) : undefined,
    maxFeePerGas: gasPrice ? BigInt(Number(gasPrice)) : undefined,
  }
}

export function* sendAndMonitorTransaction({
  context,
  wallet,
  request,
}: {
  context: TransactionContext
  wallet: ViemWallet
  request: SimulateContractReturnType['request']
}) {
  Logger.debug(TAG + '@sendAndMonitorTransaction', `Sending transaction with id: ${context.id}`)

  const commonTxAnalyticsProps = { txId: context.id, web3Library: 'viem' as const }

  ValoraAnalytics.track(TransactionEvents.transaction_start, {
    ...commonTxAnalyticsProps,
    description: context.description,
  })

  const sendTxMethod = function* () {
    const hash = yield* call([wallet, 'writeContract'], request)
    ValoraAnalytics.track(TransactionEvents.transaction_hash_received, {
      ...commonTxAnalyticsProps,
      txHash: hash,
    })
    const receipt = yield* call([publicClient.celo, 'waitForTransactionReceipt'], { hash })
    ValoraAnalytics.track(TransactionEvents.transaction_receipt_received, commonTxAnalyticsProps)
    return receipt
  }

  try {
    // Reuse existing method which times out the sendTxMethod and includes some
    // grace period logic to handle app backgrounding when sending.
    // there is a bug with 'race' in typed-redux-saga, so we need to hard cast the result
    // https://github.com/agiledigital/typed-redux-saga/issues/43#issuecomment-1259706876
    const receipt = (yield* call(
      wrapSendTransactionWithRetry,
      sendTxMethod,
      context
    )) as unknown as TransactionReceipt

    if (receipt.status === 'reverted') {
      throw new Error('transaction reverted')
    }
    ValoraAnalytics.track(TransactionEvents.transaction_confirmed, commonTxAnalyticsProps)
    yield* put(
      transactionConfirmed(context.id, {
        transactionHash: receipt.transactionHash,
        block: receipt.blockNumber.toString(),
        status: true,
      })
    )
    yield* put(fetchTokenBalances({ showLoading: true }))
    return receipt
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG + '@sendAndMonitorTransaction', `Error sending tx ${context.id}`, error)
    ValoraAnalytics.track(TransactionEvents.transaction_exception, {
      ...commonTxAnalyticsProps,
      error: error.message,
    })
    yield* put(removeStandbyTransaction(context.id))
    yield* put(transactionFailed(context.id))
    yield* put(showError(ErrorMessages.TRANSACTION_FAILED))
    throw error
  }
}
