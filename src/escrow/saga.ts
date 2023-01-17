import { EscrowWrapper } from '@celo/contractkit/lib/wrappers/Escrow'
import { all, call, put, race, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { EscrowEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  Actions as EscrowActions,
  EscrowedPayment,
  EscrowReclaimPaymentAction,
  fetchSentEscrowPayments,
  reclaimEscrowPaymentFailure,
  reclaimEscrowPaymentSuccess,
  storeSentEscrowPayments,
} from 'src/escrow/actions'
import { calculateFee, currencyToFeeCurrency } from 'src/fees/saga'
import { identifierToE164NumberSelector } from 'src/identity/selectors'
import { navigateHome } from 'src/navigator/NavigationService'
import { getCurrencyAddress } from 'src/tokens/saga'
import { fetchTokenBalances } from 'src/tokens/slice'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { estimateGas } from 'src/web3/utils'

const TAG = 'escrow/saga'

export async function createReclaimTransaction(paymentID: string) {
  const contractKit = await getContractKitAsync()

  const escrow = await contractKit.contracts.getEscrow()
  return escrow.revoke(paymentID).txo
}

export async function getReclaimEscrowGas(account: string, paymentID: string) {
  Logger.debug(`${TAG}/getReclaimEscrowGas`, 'Getting gas estimate for escrow reclaim tx')
  const tx = await createReclaimTransaction(paymentID)
  const txParams = {
    from: account,
    feeCurrency: await getCurrencyAddress(Currency.Dollar),
  }
  const gas = await estimateGas(tx, txParams)
  Logger.debug(`${TAG}/getReclaimEscrowGas`, `Estimated gas of ${gas.toString()}}`)
  return gas
}

export async function getReclaimEscrowFee(account: string, paymentID: string) {
  const gas = await getReclaimEscrowGas(account, paymentID)
  // TODO: Add support for any allowed fee currency, not just dollar.
  return calculateFee(gas, await currencyToFeeCurrency(Currency.Dollar))
}

export function* reclaimFromEscrow({ paymentID }: EscrowReclaimPaymentAction) {
  Logger.debug(TAG + '@reclaimFromEscrow', 'Reclaiming escrowed payment')

  try {
    ValoraAnalytics.track(EscrowEvents.escrow_reclaim_start)
    const account = yield call(getConnectedUnlockedAccount)

    const reclaimTx = yield call(createReclaimTransaction, paymentID)
    const { cancel } = yield race({
      success: call(
        sendTransaction,
        reclaimTx,
        account,
        newTransactionContext(TAG, 'Reclaim escrowed funds')
      ),
      cancel: take(EscrowActions.RECLAIM_PAYMENT_CANCEL),
    })
    if (cancel) {
      Logger.warn(TAG + '@reclaimFromEscrow', 'Reclaiming escrow cancelled')
      return
    }
    Logger.debug(TAG + '@reclaimFromEscrow', 'Done reclaiming escrow')

    yield put(fetchTokenBalances({ showLoading: true }))
    yield put(reclaimEscrowPaymentSuccess())

    yield call(navigateHome)
    ValoraAnalytics.track(EscrowEvents.escrow_reclaim_complete)
  } catch (e) {
    Logger.error(TAG + '@reclaimFromEscrow', 'Error reclaiming payment from escrow', e)
    ValoraAnalytics.track(EscrowEvents.escrow_reclaim_error, { error: e.message })
    yield put(showErrorOrFallback(e, ErrorMessages.RECLAIMING_ESCROWED_PAYMENT_FAILED))
    yield put(reclaimEscrowPaymentFailure())
  } finally {
    yield put(fetchSentEscrowPayments())
  }
}

async function getEscrowedPayment(escrow: EscrowWrapper, paymentID: string) {
  Logger.debug(TAG + '@getEscrowedPayment', 'Fetching escrowed payment')

  try {
    const payment = await escrow.escrowedPayments(paymentID)
    return payment
  } catch (e) {
    Logger.warn(TAG + '@getEscrowedPayment', 'Error fetching escrowed payment', e)
    throw e
  }
}

function* doFetchSentPayments() {
  Logger.debug(TAG + '@doFetchSentPayments', 'Fetching valid sent escrowed payments')

  try {
    ValoraAnalytics.track(EscrowEvents.escrow_fetch_start)
    const contractKit = yield call(getContractKit)

    const escrow: EscrowWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getEscrow,
    ])
    const account: string = yield call(getConnectedAccount)

    const sentPaymentIDs: string[] = yield call(escrow.getSentPaymentIds, account) // Note: payment ids are currently temp wallet addresses
    if (!sentPaymentIDs || !sentPaymentIDs.length) {
      Logger.debug(TAG + '@doFetchSentPayments', 'No payments ids found, clearing stored payments')
      yield put(storeSentEscrowPayments([]))
      return
    }
    Logger.debug(
      TAG + '@doFetchSentPayments',
      `Fetching data for ${sentPaymentIDs.length} payments`
    )
    const sentPaymentsRaw = yield all(
      sentPaymentIDs.map((paymentID) => call(getEscrowedPayment, escrow, paymentID))
    )

    const identifierToE164Number = yield select(identifierToE164NumberSelector)
    const sentPayments: EscrowedPayment[] = []
    for (let i = 0; i < sentPaymentsRaw.length; i++) {
      const address = sentPaymentIDs[i].toLowerCase()
      const recipientPhoneNumber = identifierToE164Number[sentPaymentsRaw[i].recipientIdentifier]
      const payment = sentPaymentsRaw[i]
      if (!payment) {
        continue
      }

      const escrowPaymentWithRecipient: EscrowedPayment = {
        paymentID: address,
        senderAddress: payment[1],
        // TODO: Remove the phone from here and calculate it using the identifier where needed
        // since identifier mapping could be fetched after this is called.
        recipientPhone: recipientPhoneNumber,
        recipientIdentifier: payment.recipientIdentifier,
        tokenAddress: payment.token.toLowerCase(),
        amount: payment[3],
        timestamp: payment[6],
        expirySeconds: payment[7],
      }
      sentPayments.push(escrowPaymentWithRecipient)
    }

    yield put(storeSentEscrowPayments(sentPayments))
    ValoraAnalytics.track(EscrowEvents.escrow_fetch_complete)
  } catch (e) {
    ValoraAnalytics.track(EscrowEvents.escrow_fetch_error, { error: e.message })
    Logger.error(TAG + '@doFetchSentPayments', 'Error fetching sent escrowed payments', e)
  }
}

export function* watchReclaimPayment() {
  yield takeLeading(Actions.RECLAIM_PAYMENT, reclaimFromEscrow)
}

export function* watchFetchSentPayments() {
  yield takeLeading(Actions.FETCH_SENT_PAYMENTS, doFetchSentPayments)
}

export function* escrowSaga() {
  yield spawn(watchReclaimPayment)
  yield spawn(watchFetchSentPayments)
}
