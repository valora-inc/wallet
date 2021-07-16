import BigNumber from 'bignumber.js'
import {
  call,
  cancelled,
  put,
  race,
  select,
  spawn,
  take,
  takeEvery,
  takeLeading,
} from 'redux-saga/effects'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { Actions as AppActions, ActionTypes as AppActionTypes } from 'src/app/actions'
import {
  Actions,
  assignProviderToTxHash,
  BidaliPaymentRequestedAction,
  setProviderLogos,
  setProvidersForTxHashes,
} from 'src/fiatExchanges/actions'
import { lastUsedProviderSelector, ProviderLogos } from 'src/fiatExchanges/reducer'
import { providerTxHashesChannel, readOnceFromFirebase } from 'src/firebase/firebase'
import i18n from 'src/i18n'
import { updateKnownAddresses } from 'src/identity/actions'
import { providerAddressesSelector } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AddressRecipient, getDisplayName } from 'src/recipients/recipient'
import { Actions as SendActions } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendAmount'
import {
  Actions as TransactionActions,
  NewTransactionsInFeedAction,
} from 'src/transactions/actions'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getAccount } from 'src/web3/saga'

const TAG = 'fiatExchanges/saga'

function* bidaliPaymentRequest({
  amount,
  address,
  currency,
  description,
  chargeId,
  onPaymentSent,
  onCancelled,
}: BidaliPaymentRequestedAction) {
  Logger.debug(
    `${TAG}@bidaliPaymentRequest`,
    `Send ${amount} ${currency} to ${address} for ${description} (${chargeId})`
  )

  if (currency.toUpperCase() !== 'CUSD') {
    // This is not supposed to happen in production, the current flow limits
    // to cUSD only
    throw new Error(`Unsupported payment currency from Bidali: ${currency}`)
  }

  const recipient: AddressRecipient = {
    address,
    name: 'Bidali',
    thumbnailPath:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fbidali.png?alt=media',
  }
  const transactionData: TransactionDataInput = {
    recipient,
    amount: new BigNumber(amount),
    currency: Currency.Dollar,
    reason: `${description} (${chargeId})`,
    type: TokenTransactionType.PayPrefill,
  }
  navigate(Screens.SendConfirmationModal, {
    transactionData,
    origin: SendOrigin.Bidali,
  })

  while (true) {
    const { cancel } = yield race({
      sendStart: take(SendActions.SEND_PAYMENT_OR_INVITE),
      cancel: take(
        (action: AppActionTypes) =>
          action.type === AppActions.ACTIVE_SCREEN_CHANGED &&
          action.activeScreen === Screens.BidaliScreen
      ),
    })

    if (cancel) {
      Logger.debug(`${TAG}@bidaliPaymentRequest`, 'Cancelled')
      yield call(onCancelled)
      return
    }

    const { success } = yield race({
      success: take(SendActions.SEND_PAYMENT_OR_INVITE_SUCCESS),
      failure: take(SendActions.SEND_PAYMENT_OR_INVITE_FAILURE),
    })

    if (success) {
      Logger.debug(`${TAG}@bidaliPaymentRequest`, 'Payment Sent')
      yield call(onPaymentSent)

      // Keep address mapping locally
      yield put(
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

export function* searchNewItemsForProviderTxs({ transactions }: NewTransactionsInFeedAction) {
  try {
    if (!transactions || !transactions.length) {
      return
    }
    Logger.debug(TAG + 'searchNewItemsForProviderTxs', `Checking ${transactions.length} txs`)

    const providerAddresses = yield select(providerAddressesSelector)
    const lastUsedProvider = yield select(lastUsedProviderSelector)

    for (const tx of transactions) {
      if (tx.__typename !== 'TokenTransfer' || tx.type !== TokenTransactionType.Received) {
        continue
      }

      if (providerAddresses.includes(tx.address)) {
        ValoraAnalytics.track(FiatExchangeEvents.cash_in_success, {
          provider: lastUsedProvider?.name ?? 'unknown',
        })
        yield put(assignProviderToTxHash(tx.hash, tx.amount.currencyCode))
      }
    }

    Logger.debug(TAG + 'searchNewItemsForProviderTxs', 'Done checking txs')
  } catch (error) {
    Logger.error(TAG + 'searchNewItemsForProviderTxs', error)
  }
}

export function* watchProviderTxHashes() {
  const account = yield call(getAccount)
  const channel = yield call(providerTxHashesChannel, account)
  if (!channel) {
    return
  }
  try {
    while (true) {
      const txHashesToProvider = yield take(channel)
      yield put(setProvidersForTxHashes(txHashesToProvider))
    }
  } catch (error) {
    Logger.error(`${TAG}@watchProviderTxHashes`, error)
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* importProviderLogos() {
  const providerLogos: ProviderLogos = yield readOnceFromFirebase('providerLogos')
  setProviderLogos(providerLogos)
}

export function* watchBidaliPaymentRequests() {
  yield takeLeading(Actions.BIDALI_PAYMENT_REQUESTED, bidaliPaymentRequest)
}

function* watchNewFeedTransactions() {
  yield takeEvery(TransactionActions.NEW_TRANSACTIONS_IN_FEED, searchNewItemsForProviderTxs)
}

export function* fiatExchangesSaga() {
  yield spawn(watchBidaliPaymentRequests)
  yield spawn(watchNewFeedTransactions)
  yield spawn(watchProviderTxHashes)
  yield spawn(importProviderLogos)
}
