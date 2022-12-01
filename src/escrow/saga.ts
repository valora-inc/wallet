import { CeloTxReceipt, Contract, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { EscrowWrapper } from '@celo/contractkit/lib/wrappers/Escrow'
import BigNumber from 'bignumber.js'
import { all, call, put, race, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { EscrowEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ESCROW_PAYMENT_EXPIRY_SECONDS } from 'src/config'
import {
  Actions,
  Actions as EscrowActions,
  EscrowedPayment,
  EscrowReclaimPaymentAction,
  EscrowTransferPaymentAction,
  fetchSentEscrowPayments,
  reclaimEscrowPaymentFailure,
  reclaimEscrowPaymentSuccess,
  storeSentEscrowPayments,
} from 'src/escrow/actions'
import { generateUniquePaymentId } from 'src/escrow/utils'
import { calculateFee, currencyToFeeCurrency } from 'src/fees/saga'
import { identifierToE164NumberSelector } from 'src/identity/selectors'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { navigateHome } from 'src/navigator/NavigationService'
import { fetchStableBalances } from 'src/stableToken/actions'
import {
  getCurrencyAddress,
  getERC20TokenContract,
  tokenAmountInSmallestUnit,
} from 'src/tokens/saga'
import { tokensListSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { addStandbyTransaction, addStandbyTransactionLegacy } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import {
  newTransactionContext,
  TokenTransactionTypeV2,
  TransactionContext,
  TransactionStatus,
} from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { estimateGas } from 'src/web3/utils'

/**
 * TODO: Clear out unused code for escrow. Much of the code is unused now that Centralized Phone Verification
 * is used instead of Komenci.
 *
 * The only features that should still be active are showing escrow transactions in the home feed properly
 * and allowing users to redeem unclaimed escrow invites.
 * https://valora-app.slack.com/archives/C025V1D6F3J/p1669742116085229
 */

const TAG = 'escrow/saga'

// Observed approve and escrow transfer transactions take less than 150k and 550k gas respectively.
const STATIC_APPROVE_TRANSFER_GAS_ESTIMATE = 150000
export const STATIC_ESCROW_TRANSFER_GAS_ESTIMATE = 550000

// NOTE: Only supports static estimation as that is what is expected to be used.
// This function can be extended to use online estimation is needed.
export async function getEscrowTxGas() {
  return new BigNumber(STATIC_APPROVE_TRANSFER_GAS_ESTIMATE + STATIC_ESCROW_TRANSFER_GAS_ESTIMATE)
}

export function* transferToEscrow(action: EscrowTransferPaymentAction) {
  Logger.debug(TAG + '@transferToEscrow', 'Begin transfer to escrow')
  try {
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_start)
    const { phoneHashDetails, amount, tokenAddress, feeInfo, context } = action
    const { phoneHash, pepper } = phoneHashDetails
    const [kit, walletAddress]: [ContractKit, string] = yield all([
      call(getContractKit),
      call(getConnectedUnlockedAccount),
    ])

    const [tokenContract, escrowWrapper]: [Contract, EscrowWrapper] = yield all([
      call(getERC20TokenContract, tokenAddress),
      call([kit.contracts, kit.contracts.getEscrow]),
    ])

    const escrowPaymentIds: string[] = yield call(
      [escrowWrapper, escrowWrapper.getReceivedPaymentIds],
      phoneHash
    )

    const paymentId: string | undefined = generateUniquePaymentId(
      escrowPaymentIds,
      phoneHash,
      pepper
    )

    if (!paymentId) {
      throw Error('Could not generate a unique paymentId for escrow. Should never happen')
    }

    const tokens: TokenBalance[] = yield select(tokensListSelector)
    const tokenInfo = tokens.find((token) => token.address === tokenAddress)
    if (!tokenInfo) {
      throw Error(`Couldnt find token info for address ${tokenAddress}. Should never happen`)
    }
    // Approve a transfer of funds to the Escrow contract.
    const convertedAmount: string = yield call(tokenAmountInSmallestUnit, amount, tokenAddress)

    Logger.debug(TAG + '@transferToEscrow', 'Approving escrow transfer')

    const approvalTx = toTransactionObject(
      kit.connection,
      tokenContract.methods.approve(escrowWrapper.address, convertedAmount)
    )

    const approvalReceipt: CeloTxReceipt = yield call(
      sendTransaction,
      approvalTx.txo,
      walletAddress,
      newTransactionContext(TAG, 'Approve transfer to Escrow'),
      feeInfo?.gas.toNumber(),
      feeInfo?.gasPrice,
      feeInfo?.feeCurrency
    )
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_approve_tx_sent)

    // Tranfser the funds to the Escrow contract.
    Logger.debug(TAG + '@transferToEscrow', 'Transfering to escrow')
    yield call(registerStandbyTransactionLegacy, context, amount.toString(), escrowWrapper.address)
    yield call(
      registerStandbyTransaction,
      context,
      amount.negated().toString(),
      tokenAddress,
      escrowWrapper.address
    )
    const transferTx = escrowWrapper.transfer(
      phoneHash,
      tokenAddress,
      convertedAmount,
      ESCROW_PAYMENT_EXPIRY_SECONDS,
      paymentId,
      NUM_ATTESTATIONS_REQUIRED
    )
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_transfer_tx_sent)
    const { receipt, error }: { receipt: CeloTxReceipt | undefined; error: any } = yield call(
      sendAndMonitorTransaction,
      transferTx,
      walletAddress,
      context,
      feeInfo?.feeCurrency,
      feeInfo?.gas.minus(approvalReceipt.gasUsed).toNumber(),
      feeInfo?.gasPrice
    )
    if (receipt) {
      yield put(fetchSentEscrowPayments())
      ValoraAnalytics.track(EscrowEvents.escrow_transfer_complete, {
        paymentId,
      })
    } else {
      throw error
    }
  } catch (e) {
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_error, { error: e.message })
    Logger.error(TAG + '@transferToEscrow', 'Error transfering to escrow', e)
    yield put(showErrorOrFallback(e, ErrorMessages.ESCROW_TRANSFER_FAILED))
  }
}

export function* registerStandbyTransactionLegacy(
  context: TransactionContext,
  value: string,
  address: string
) {
  yield put(
    addStandbyTransactionLegacy({
      context,
      type: TokenTransactionType.EscrowSent,
      status: TransactionStatus.Pending,
      value,
      currency: Currency.Dollar,
      timestamp: Math.floor(Date.now() / 1000),
      address,
      comment: '',
    })
  )
}

export function* registerStandbyTransaction(
  context: TransactionContext,
  value: string,
  tokenAddress: string,
  address: string
) {
  yield put(
    addStandbyTransaction({
      context,
      type: TokenTransactionTypeV2.InviteSent,
      status: TransactionStatus.Pending,
      value,
      tokenAddress,
      timestamp: Math.floor(Date.now() / 1000),
      address,
      comment: '',
    })
  )
}

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

    yield put(fetchStableBalances())
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

export function* watchTransferPayment() {
  yield takeLeading(Actions.TRANSFER_PAYMENT, transferToEscrow)
}

export function* watchReclaimPayment() {
  yield takeLeading(Actions.RECLAIM_PAYMENT, reclaimFromEscrow)
}

export function* watchFetchSentPayments() {
  yield takeLeading(Actions.FETCH_SENT_PAYMENTS, doFetchSentPayments)
}

export function* escrowSaga() {
  yield spawn(watchTransferPayment)
  yield spawn(watchReclaimPayment)
  yield spawn(watchFetchSentPayments)
}
