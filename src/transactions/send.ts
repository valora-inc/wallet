import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'

const TAG = 'transactions/send'

const NONCE_TOO_LOW_ERROR = 'nonce too low'
const KNOWN_TX_ERROR = 'known transaction'
const CHECK_FOR_TX_RECEIPT_ERROR = 'failed to check for transaction receipt'

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
