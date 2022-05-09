import BigNumber from 'bignumber.js'
import { call, put, race, select, spawn, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType } from 'src/apollo/types'
import { Actions as AppActions, ActionTypes as AppActionTypes } from 'src/app/actions'
import {
  Actions,
  assignProviderToTxHash,
  BidaliPaymentRequestedAction,
  setProviderLogos,
} from 'src/fiatExchanges/actions'
import { ProviderLogos, providerLogosSelector, TxHashToProvider } from 'src/fiatExchanges/reducer'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import i18n from 'src/i18n'
import { updateKnownAddresses } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AddressRecipient, getDisplayName } from 'src/recipients/recipient'
import { Actions as SendActions } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendConfirmationLegacy'
import {
  Actions as TransactionActions,
  NewTransactionsInFeedAction,
} from 'src/transactions/actions'
import { resolveCurrency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getAccount } from 'src/web3/saga'

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

  const recipient: AddressRecipient = {
    address,
    name: 'Bidali',
    thumbnailPath:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fbidali.png?alt=media',
  }
  const transactionData: TransactionDataInput = {
    recipient,
    amount: new BigNumber(amount),
    currency,
    reason: `${description} (${chargeId})`,
    type: TokenTransactionType.PayPrefill,
  }
  navigate(Screens.SendConfirmationLegacyModal, {
    transactionData,
    origin: SendOrigin.Bidali,
  })

  while (true) {
    const { cancel } = yield race({
      sendStart: take(SendActions.SEND_PAYMENT_OR_INVITE_LEGACY),
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

export function* fetchTxHashesToProviderMapping() {
  const account = yield call(getAccount)
  const txHashesToProvider: TxHashToProvider = yield readOnceFromFirebase(
    `registrations/${account}/txHashes`
  )
  return txHashesToProvider
}

export function* tagTxsWithProviderInfo({ transactions }: NewTransactionsInFeedAction) {
  try {
    if (!transactions || !transactions.length) {
      return
    }

    Logger.debug(`${TAG}@tagTxsWithProviderInfo`, `Checking ${transactions.length} txs`)

    const providerLogos: ProviderLogos = yield select(providerLogosSelector)
    const txHashesToProvider: TxHashToProvider = yield call(fetchTxHashesToProviderMapping)

    for (const tx of transactions) {
      if (tx.__typename !== 'TokenTransfer' || tx.type !== TokenTransactionType.Received) {
        continue
      }

      const provider = txHashesToProvider[tx.hash]
      const providerLogo = providerLogos[provider || '']

      if (provider && providerLogo) {
        yield put(assignProviderToTxHash(tx.hash, { name: provider, icon: providerLogo }))
      }
    }

    Logger.debug(`${TAG}@tagTxsWithProviderInfo`, 'Done checking txs')
  } catch (error) {
    Logger.error(`${TAG}@tagTxsWithProviderInfo`, 'Failed to tag txs with provider info', error)
  }
}

export function* importProviderLogos() {
  const providerLogos: ProviderLogos = yield readOnceFromFirebase('providerLogos')
  yield put(setProviderLogos(providerLogos))
}

export function* watchBidaliPaymentRequests() {
  yield takeLeading(Actions.BIDALI_PAYMENT_REQUESTED, bidaliPaymentRequest)
}

function* watchNewFeedTransactions() {
  yield takeEvery(TransactionActions.NEW_TRANSACTIONS_IN_FEED, tagTxsWithProviderInfo)
}

export function* fiatExchangesSaga() {
  yield spawn(watchBidaliPaymentRequests)
  yield spawn(watchNewFeedTransactions)
  yield spawn(importProviderLogos)
}
