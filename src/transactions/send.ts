import { CeloTxObject, CeloTxReceipt } from '@celo/connect'
import { BigNumber } from 'bignumber.js'
import { TransactionEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { STATIC_GAS_PADDING } from 'src/config'
import { fetchFeeCurrencySaga } from 'src/fees/saga'
import { coreTokensSelector } from 'src/tokens/selectors'
import { TokenBalanceWithAddress } from 'src/tokens/slice'
import {
  SendTransactionLogEvent,
  SendTransactionLogEventType,
  sendTransactionAsync,
} from 'src/transactions/contract-utils'
import { TransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { assertNever } from 'src/utils/typescript'
import { WEI_DECIMALS } from 'src/web3/consts'
import { getGasPrice } from 'src/web3/gas'
import { walletAddressSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'
import { call, cancel, cancelled, delay, fork, join, race, select } from 'typed-redux-saga'
import { TransactionReceipt, WaitForTransactionReceiptReturnType } from 'viem'

const TAG = 'transactions/send'

// TODO(Rossy) We need to avoid retries for now because we don't have a way of forcing serialization
// in cases where we have multiple parallel txs, like in verification. The nonces can get mixed up
// causing failures when a tx times out (rare but can happen on slow devices)
const TX_NUM_TRIES = 1 // Try txs up to this many times
const TX_RETRY_DELAY = 2000 // 2s
const NONCE_TOO_LOW_ERROR = 'nonce too low'
const OUT_OF_GAS_ERROR = 'out of gas'
const ALWAYS_FAILING_ERROR = 'always failing transaction'
const KNOWN_TX_ERROR = 'known transaction'
const CHECK_FOR_TX_RECEIPT_ERROR = 'failed to check for transaction receipt'

// 90s. Maximum total time to wait for confirmation when sending a transaction. (Includes grace period)
const TX_TIMEOUT = 90000
// 5000 ms. After a timeout triggers, time to wait before throwing an error.
// Gives time reconnect and fetch receipts in case network conditions change while the app is suspended.
const TX_TIMEOUT_GRACE_PERIOD = 5000

const getLogger = (context: TransactionContext) => {
  const txId = context.id
  const web3Library = 'contract-kit'
  const tag = context.tag ?? TAG
  return (event: SendTransactionLogEvent) => {
    switch (event.type) {
      case SendTransactionLogEventType.Started:
        Logger.debug(tag, `Sending transaction with id ${txId}`)
        ValoraAnalytics.track(TransactionEvents.transaction_start, {
          txId,
          description: context.description,
          fornoMode: true,
          web3Library,
        })
        break
      case SendTransactionLogEventType.EstimatedGas:
        Logger.debug(
          tag,
          `Transaction with id ${txId} ${
            event.prefilled ? 'using provided estimate' : 'estimated'
          } gas: ${event.gas}`
        )
        ValoraAnalytics.track(TransactionEvents.transaction_gas_estimated, {
          txId,
          estimatedGas: event.gas,
          prefilled: event.prefilled,
          feeCurrencyAddress: event.feeCurrencyAddress,
          web3Library,
        })
        break
      case SendTransactionLogEventType.TransactionHashReceived:
        Logger.debug(tag, `Transaction id ${txId} hash received: ${event.hash}`)
        ValoraAnalytics.track(TransactionEvents.transaction_hash_received, {
          txId,
          txHash: event.hash,
          web3Library,
        })
        break
      case SendTransactionLogEventType.Confirmed:
        if (event.number > 0) {
          Logger.warn(tag, `Transaction id ${txId} extra confirmation received: ${event.number}`)
        }
        Logger.debug(tag, `Transaction confirmed with id: ${txId}`)
        ValoraAnalytics.track(TransactionEvents.transaction_confirmed, { txId, web3Library })
        break
      case SendTransactionLogEventType.ReceiptReceived:
        Logger.debug(tag, `Transaction id ${txId} received receipt:`, event.receipt)
        ValoraAnalytics.track(TransactionEvents.transaction_receipt_received, { txId, web3Library })
        break
      case SendTransactionLogEventType.Failed:
        Logger.error(tag, `Transaction failed: ${txId}`, event.error)
        ValoraAnalytics.track(TransactionEvents.transaction_error, {
          txId,
          error: event.error.message,
          web3Library,
        })
        break
      case SendTransactionLogEventType.Exception:
        Logger.error(tag, `Transaction Exception caught ${txId}:`, event.error)
        ValoraAnalytics.track(TransactionEvents.transaction_exception, {
          txId,
          error: event.error.message,
          feeCurrencyAddress: event.feeCurrencyAddress,
          web3Library,
        })
        break
      default:
        assertNever(event)
    }
  }
}

// This function returns the feeCurrency and gas/gasPrice to use to send a tx.
// If gas or gasPrice are not passed, we estimate/calculate them.
// If the balance is not enough to pay for the gas fee, we return the currency with
// highest balance, sometimes return a gas value if we can return a good estimate
// and an empty gasPrice value.
export function* chooseTxFeeDetails(
  tx: CeloTxObject<any>,
  preferredFeeCurrency: string | undefined,
  gas?: number,
  gasPrice?: BigNumber
) {
  const coreTokens: TokenBalanceWithAddress[] = yield* select(coreTokensSelector)
  const tokenInfo = coreTokens.find(
    (token) =>
      token.address === preferredFeeCurrency || (token.symbol === 'CELO' && !preferredFeeCurrency)
  )
  if (!tokenInfo || tokenInfo.balance.isZero()) {
    const feeCurrency: string | undefined = yield* call(fetchFeeCurrencySaga)
    return {
      feeCurrency,
      // If gas was set and we switched from CELO to a non-CELO fee currency, we add some padding to it
      // since it takes a bit more gas to pay for fees using a non-CELO fee currency.
      gas: gas && !preferredFeeCurrency && feeCurrency ? gas + STATIC_GAS_PADDING : gas,
      // Set gasPrice to undefined if the currency being used for the fee changed.
      gasPrice: preferredFeeCurrency !== feeCurrency ? undefined : gasPrice,
    }
  }
  const userAddress = yield* select(walletAddressSelector)
  if (!userAddress) {
    throw new Error('No wallet address found')
  }
  const feeCurrency = tokenInfo.symbol === 'CELO' ? undefined : tokenInfo.address
  if (!gas) {
    gas = (
      (yield* call(estimateGas, tx, {
        from: userAddress,
        feeCurrency,
      })) as BigNumber
    ).toNumber()
  }
  if (!gasPrice) {
    gasPrice = yield* call(getGasPrice, feeCurrency)
  }
  if (new BigNumber(gasPrice!).times(gas!).lte(tokenInfo.balance.shiftedBy(WEI_DECIMALS))) {
    return {
      feeCurrency,
      gas,
      gasPrice,
    }
  } else {
    // Funds are not enough to pay for the fee.
    const feeCurrency: string | undefined = yield* call(fetchFeeCurrencySaga)
    return {
      feeCurrency,
      // If gas was set and we switched from CELO to a non-CELO fee currency, we add some padding to it
      // since it takes a bit more gas to pay for fees using a non-CELO fee currency.
      // Why aren't we just estimating again?
      // It may result in errors for the dapp. E.g. If a dapp developer is doing a two step approve and exchange and requesting both signatures
      // together, they will set the gas on the second transaction because if estimateGas is run before the approve completes, execution will fail.
      gas: gas && !preferredFeeCurrency && feeCurrency ? gas + STATIC_GAS_PADDING : gas,
      // Set gasPrice to undefined if the currency being used for the fee changed.
      gasPrice: preferredFeeCurrency !== feeCurrency ? undefined : gasPrice,
    }
  }
}

// Sends a transaction and async returns promises for the txhash, confirmation, and receipt
// Only use this method if you need more granular control of the different events
// WARNING: this method doesn't have retry and timeout logic built in, turns out that's tricky
// to get right with this promise set interface. Prefer sendTransaction below
export function* sendTransactionPromises(
  tx: CeloTxObject<any>,
  account: string,
  context: TransactionContext,
  preferredFeeCurrency: string | undefined,
  proposedGas?: number,
  proposedGasPrice?: BigNumber,
  nonce?: number
) {
  Logger.debug(
    `${TAG}@sendTransactionPromises`,
    `Going to send a transaction with id ${context.id}`
  )

  const { feeCurrency, gas, gasPrice } = yield* call(
    chooseTxFeeDetails,
    tx,
    preferredFeeCurrency,
    proposedGas,
    proposedGasPrice
  )

  if (gas || gasPrice) {
    Logger.debug(
      `${TAG}@sendTransactionPromises`,
      `Using provided gas parameters: ${gas} gas @ ${gasPrice} ${feeCurrency}`
    )
  }

  Logger.debug(`${TAG}@sendTransactionPromises`, `Sending tx ${context.id}`)

  const transactionPromises = yield* call(
    sendTransactionAsync,
    tx,
    account,
    feeCurrency,
    getLogger(context),
    gas,
    gasPrice?.toString(),
    nonce
  )
  return transactionPromises
}

// Send a transaction and await for its confirmation
// Use this method for sending transactions and awaiting them to be confirmed
export function* sendTransaction(
  tx: CeloTxObject<any>,
  account: string,
  context: TransactionContext,
  gas?: number,
  gasPrice?: BigNumber,
  feeCurrency?: string | undefined,
  nonce?: number
) {
  const sendTxMethod = function* () {
    const { receipt } = yield* call(
      sendTransactionPromises,
      tx,
      account,
      context,
      feeCurrency,
      gas,
      gasPrice,
      nonce
    )
    return (yield receipt) as CeloTxReceipt
  }
  // there is a bug with 'race' in typed-redux-saga, so we need to hard cast the result
  // https://github.com/agiledigital/typed-redux-saga/issues/43#issuecomment-1259706876
  const receipt = (yield* call(
    wrapSendTransactionWithRetry,
    sendTxMethod,
    context
  )) as unknown as CeloTxReceipt
  return receipt
}

// SendTransactionMethod is a redux saga generator that takes a nonce and returns a receipt.
export type SendTransactionMethod<
  T extends CeloTxReceipt | WaitForTransactionReceiptReturnType = CeloTxReceipt,
> = (nonce?: number) => Generator<any, T, any>

export function* wrapSendTransactionWithRetry<
  T extends CeloTxReceipt | TransactionReceipt = CeloTxReceipt,
>(sendTxMethod: SendTransactionMethod<T>, context: TransactionContext) {
  for (let i = 1; i <= TX_NUM_TRIES; i++) {
    try {
      // Spin tx send into a Task so that it does not get cancelled automatically on timeout.
      const task = yield* fork(sendTxMethod)
      let { receipt, timeout } = yield* race({
        receipt: join(task),
        timeout: delay(TX_TIMEOUT * i - TX_TIMEOUT_GRACE_PERIOD),
      })

      // In some conditions (e.g. app backgrounding) the app may become suspended, preventing the
      // send task from making progress. If this occurs for long enough that the timeout elapses, a
      // timeout may be triggered even if the transaction send is complete. A second race is
      // triggered here to handle these cases by giving the send task a grace period to return a
      // result after the initial timeout fires.
      if (timeout && TX_TIMEOUT_GRACE_PERIOD > 0) {
        Logger.debug(
          `${TAG}@wrapSendTransactionWithRetry`,
          `tx ${context.id} entering timeout grace period for attempt ${i}`
        )
        ;({ receipt, timeout } = yield* race({
          receipt: join(task),
          timeout: delay(TX_TIMEOUT_GRACE_PERIOD),
        }))
      }

      // Cancel the send task if it is still running. If terminated, this is a no-op.
      yield* cancel(task)

      if (timeout) {
        Logger.error(
          `${TAG}@wrapSendTransactionWithRetry`,
          `tx ${context.id} timeout for attempt ${i}`
        )
        throw new Error(ErrorMessages.TRANSACTION_TIMEOUT)
      }

      Logger.debug(
        `${TAG}@wrapSendTransactionWithRetry`,
        `tx ${context.id} successful for attempt ${i}`
      )
      return receipt
    } catch (err) {
      Logger.error(`${TAG}@wrapSendTransactionWithRetry`, `Tx ${context.id} failed`, err)

      if (!shouldTxFailureRetry(err)) {
        throw err
      }

      if (i + 1 <= TX_NUM_TRIES) {
        yield* delay(TX_RETRY_DELAY)
        Logger.debug(
          `${TAG}@wrapSendTransactionWithRetry`,
          `Tx ${context.id} retrying attempt ${i + 1}`
        )
      } else {
        throw err
      }
    } finally {
      if (yield* cancelled()) {
        Logger.warn(
          `${TAG}@wrapSendTransactionWithRetry`,
          `tx ${context.id} cancelled on attempt ${i}`
        )
      }
    }
  }
}

/**
 * Given an error thrown while attempting a transaction,
 * checks to see if that error could indicate that the transaction intent already
 * exists on the blockchain.
 **/
export function isTxPossiblyPending(err: any): boolean {
  if (!err || !err.message || typeof err.message !== 'string') {
    return false
  }

  // Transaction has timed out; it may be on the blockchain already
  if (err.message === ErrorMessages.TRANSACTION_TIMEOUT) {
    Logger.error(`${TAG}@isTxPossiblyPending`, 'Transaction timed out. Will not reattempt.')
    return true
  }

  const message = err.message.toLowerCase()

  // Geth already knows about the tx of this nonce, no point in resending it
  if (message.includes(KNOWN_TX_ERROR)) {
    Logger.error(`${TAG}@isTxPossiblyPending`, 'Known transaction error. Will not reattempt.')
    return true
  }

  // Nonce too low, probably because the tx already went through
  if (message.includes(NONCE_TOO_LOW_ERROR)) {
    Logger.error(
      `${TAG}@isTxPossiblyPending`,
      'Nonce too low, possible from retrying. Will not reattempt.'
    )
    return true
  }

  if (message.includes(CHECK_FOR_TX_RECEIPT_ERROR)) {
    Logger.error(
      `${TAG}@isTxPossiblyPending`,
      'Failed to check for tx receipt, but tx still might be confirmed. Will not reattempt'
    )
    return true
  }
  return false
}

export function shouldTxFailureRetry(err: any) {
  if (!err || !err.message || typeof err.message !== 'string') {
    return true
  }
  const message = err.message.toLowerCase()

  // Web3 doesn't like the tx, it's invalid (e.g. fails a require), or funds insufficient
  if (message.includes(OUT_OF_GAS_ERROR)) {
    Logger.error(
      `${TAG}@shouldTxFailureRetry`,
      'Out of gas or invalid tx error. Will not reattempt.'
    )
    return false
  }

  // Similar to case above
  if (message.includes(ALWAYS_FAILING_ERROR)) {
    Logger.error(`${TAG}@shouldTxFailureRetry`, 'Transaction always failing. Will not reattempt')
    return false
  }

  return !isTxPossiblyPending(err)
}
