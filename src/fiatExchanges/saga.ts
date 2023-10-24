import { Action, Predicate } from '@redux-saga/types'
import BigNumber from 'bignumber.js'
import { SendOrigin } from 'src/analytics/types'
import { ActionTypes as AppActionTypes, Actions as AppActions } from 'src/app/actions'
import {
  Actions,
  BidaliPaymentRequestedAction,
  assignProviderToTxHash,
  setProviderLogos,
} from 'src/fiatExchanges/actions'
import { ProviderLogos, TxHashToProvider, providerLogosSelector } from 'src/fiatExchanges/reducer'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import i18n from 'src/i18n'
import { updateKnownAddresses } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AddressRecipient, RecipientType, getDisplayName } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { Actions as SendActions } from 'src/send/actions'
import { CurrencyTokens, tokensByCurrencySelector } from 'src/tokens/selectors'
import { Actions as TransactionActions, UpdateTransactionsAction } from 'src/transactions/actions'
import { TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { resolveCurrency } from 'src/utils/currencies'
import { safely } from 'src/utils/safely'
import { getAccount } from 'src/web3/saga'
import { call, put, race, select, spawn, take, takeEvery, takeLeading } from 'typed-redux-saga'

const TAG = 'fiatExchanges/saga'

function* bidaliPaymentRequest({
  amount,
  address,
  currency: currencyString,
  description,
  chargeId,
  onPaymentSent,
  onCancelled,
}: BidaliPaymentRequestedAction) {
  Logger.debug(
    `${TAG}@bidaliPaymentRequest`,
    `Send ${amount} ${currencyString} to ${address} for ${description} (${chargeId})`
  )

  const currency = resolveCurrency(currencyString)
  if (!currency) {
    // This is not supposed to happen in production
    throw new Error(`Unsupported payment currency from Bidali: ${currencyString}`)
  }

  const tokens: CurrencyTokens = yield* select(tokensByCurrencySelector)
  const tokenAddress = tokens[currency]?.address
  const tokenId = tokens[currency]?.tokenId
  if (!tokenAddress || !tokenId) {
    // This is not supposed to happen in production
    throw new Error(`No token address or ID found for currency: ${currency}`)
  }

  const recipient: AddressRecipient = {
    address,
    name: 'Bidali',
    thumbnailPath:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fbidali.png?alt=media',
    recipientType: RecipientType.Address,
  }
  const transactionData: TransactionDataInput = {
    recipient,
    tokenId,
    inputAmount: new BigNumber(amount),
    amountIsInLocalCurrency: false,
    tokenAddress,
    tokenAmount: new BigNumber(amount),
    comment: `${description} (${chargeId})`,
  }
  navigate(Screens.SendConfirmationModal, {
    transactionData,
    origin: SendOrigin.Bidali,
    isFromScan: false,
  })

  while (true) {
    const { cancel } = yield* race({
      sendStart: take(SendActions.SEND_PAYMENT),
      cancel: take(
        ((action: AppActionTypes) =>
          action.type === AppActions.ACTIVE_SCREEN_CHANGED &&
          action.activeScreen === Screens.BidaliScreen) as Predicate<Action>
      ),
    })
    if (cancel) {
      Logger.debug(`${TAG}@bidaliPaymentRequest`, 'Cancelled')
      yield* call(onCancelled)
      return
    }

    const { success } = yield* race({
      success: take(SendActions.SEND_PAYMENT_SUCCESS),
      failure: take(SendActions.SEND_PAYMENT_FAILURE),
    })

    if (success) {
      Logger.debug(`${TAG}@bidaliPaymentRequest`, 'Payment Sent')
      yield* call(onPaymentSent)

      // Keep address mapping locally
      yield* put(
        updateKnownAddresses({
          [address]: {
            name: getDisplayName(recipient, i18n.t),
            imageUrl: recipient.thumbnailPath || null,
          },
        })
      )
      break
    }

    // Failure, loop again and see if the user is gonna try to send it again or just navigate back
  }
}

export function* fetchTxHashesToProviderMapping() {
  const account = yield* call(getAccount)
  const txHashesToProvider: TxHashToProvider = yield* call(
    readOnceFromFirebase,
    `registrations/${account}/txHashes`
  )
  return txHashesToProvider
}

export function* tagTxsWithProviderInfo({ transactions }: UpdateTransactionsAction) {
  try {
    if (!transactions || !transactions.length) {
      return
    }

    Logger.debug(`${TAG}@tagTxsWithProviderInfo`, `Checking ${transactions.length} txs`)

    const providerLogos: ProviderLogos = yield* select(providerLogosSelector)
    const txHashesToProvider: TxHashToProvider = yield* call(fetchTxHashesToProviderMapping)

    for (const tx of transactions) {
      if (tx.__typename !== 'TokenTransferV3' || tx.type !== TokenTransactionTypeV2.Received) {
        continue
      }

      const provider = txHashesToProvider[tx.transactionHash]
      const providerLogo = providerLogos[provider || '']

      if (provider && providerLogo) {
        yield* put(
          assignProviderToTxHash(tx.transactionHash, { name: provider, icon: providerLogo })
        )
      }
    }

    Logger.debug(`${TAG}@tagTxsWithProviderInfo`, 'Done checking txs')
  } catch (error) {
    Logger.error(`${TAG}@tagTxsWithProviderInfo`, 'Failed to tag txs with provider info', error)
  }
}

export function* importProviderLogos() {
  const providerLogos: ProviderLogos = yield readOnceFromFirebase('providerLogos')
  yield* put(setProviderLogos(providerLogos))
}

export function* watchBidaliPaymentRequests() {
  yield* takeLeading(Actions.BIDALI_PAYMENT_REQUESTED, safely(bidaliPaymentRequest))
}

function* watchNewFeedTransactions() {
  yield* takeEvery(TransactionActions.UPDATE_TRANSACTIONS, safely(tagTxsWithProviderInfo))
}

export function* fiatExchangesSaga() {
  yield* spawn(watchBidaliPaymentRequests)
  yield* spawn(watchNewFeedTransactions)
  yield* spawn(importProviderLogos)
}
