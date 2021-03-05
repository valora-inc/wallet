import { CUSD } from '../currencyConversion/consts'
import { EventBuilder } from '../helpers/EventBuilder'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { Contracts } from '../utils'

export class ExchangeCeloToToken extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.length === 2 &&
      transaction.transfers.containsTransferTo(Contracts.Reserve) &&
      transaction.transfers.containsMintedTokenTransfer()
    )
  }

  getEvent(transaction: Transaction) {
    const inTransfer = transaction.transfers.getTransferTo(Contracts.Reserve)
    const outTransfer = transaction.transfers.getMintedTokenTransfer()

    if (!inTransfer) {
      throw new Error('Transfer to Reserve not found.')
    }

    if (!outTransfer) {
      throw new Error('Minted token transfer not found.')
    }

    return EventBuilder.exchangeEvent(
      transaction,
      inTransfer,
      outTransfer,
      // TODO: this will need to be updated once cEUR is introduced
      // see https://github.com/celo-org/wallet/pull/90#discussion_r587308620
      this.context.token || CUSD,
      transaction.fees
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
