import { Action, Predicate } from '@redux-saga/types'
import BigNumber from 'bignumber.js'
import { SendOrigin } from 'src/analytics/types'
import { ActionTypes as AppActionTypes, Actions as AppActions } from 'src/app/actions'
import { Actions, BidaliPaymentRequestedAction, setProviderLogos } from 'src/fiatExchanges/actions'
import { ProviderLogos } from 'src/fiatExchanges/reducer'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import i18n from 'src/i18n'
import { updateKnownAddresses } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AddressRecipient, RecipientType, getDisplayName } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { Actions as SendActions } from 'src/send/actions'
import { CurrencyTokens, tokensByCurrencySelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'
import { resolveCurrency } from 'src/utils/currencies'
import { safely } from 'src/utils/safely'
import { call, put, race, select, spawn, take, takeLeading } from 'typed-redux-saga'

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

  if (!tokenAddress) {
    // This is not supposed to happen in production
    throw new Error(`No token address found for currency: ${currency}`)
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

export function* importProviderLogos() {
  const providerLogos: ProviderLogos = yield readOnceFromFirebase('providerLogos')
  yield* put(setProviderLogos(providerLogos))
}

export function* watchBidaliPaymentRequests() {
  yield* takeLeading(Actions.BIDALI_PAYMENT_REQUESTED, safely(bidaliPaymentRequest))
}

export function* fiatExchangesSaga() {
  yield* spawn(watchBidaliPaymentRequests)
  yield* spawn(importProviderLogos)
}
