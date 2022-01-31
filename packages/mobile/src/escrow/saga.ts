import { Result } from '@celo/base'
import {
  CeloTransactionObject,
  CeloTxReceipt,
  Contract,
  Sign,
  toTransactionObject,
} from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { EscrowWrapper } from '@celo/contractkit/lib/wrappers/Escrow'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { FetchError, TxError } from '@komenci/kit/lib/errors'
import BigNumber from 'bignumber.js'
import { all, call, put, race, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { EscrowEvents, OnboardingEvents } from 'src/analytics/Events'
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
import { generateEscrowPaymentIdAndPk, generateUniquePaymentId } from 'src/escrow/utils'
import { calculateFee, currencyToFeeCurrency } from 'src/fees/saga'
import { waitForNextBlock } from 'src/geth/saga'
import i18n from 'src/i18n'
import { Actions as IdentityActions, SetVerificationStatusAction } from 'src/identity/actions'
import { getUserSelfPhoneHashDetails } from 'src/identity/privateHashing'
import { identifierToE164NumberSelector } from 'src/identity/selectors'
import { VerificationStatus } from 'src/identity/types'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { navigateHome } from 'src/navigator/NavigationService'
import { fetchStableBalances } from 'src/stableToken/actions'
import { fetchTokenBalances, TokenBalance } from 'src/tokens/reducer'
import {
  getCurrencyAddress,
  getERC20TokenContract,
  getTokenContractFromAddress,
  tokenAmountInSmallestUnit,
} from 'src/tokens/saga'
import { tokensListSelector } from 'src/tokens/selectors'
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
import { komenciContextSelector, shouldUseKomenciSelector } from 'src/verify/reducer'
import { getKomenciKit } from 'src/verify/saga'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { mtwAddressSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'

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
      ValoraAnalytics.track(EscrowEvents.escrow_transfer_complete)
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

async function formEscrowWithdrawAndTransferTx(
  contractKit: ContractKit,
  escrowWrapper: EscrowWrapper,
  paymentId: string,
  tokenAddress: string,
  privateKey: string,
  walletAddress: string,
  metaTxWalletAddress: string,
  value: BigNumber
) {
  const msgHash = contractKit.connection.web3.utils.soliditySha3({
    type: 'address',
    value: metaTxWalletAddress,
  })

  const { r, s, v }: Sign = contractKit.connection.web3.eth.accounts.sign(msgHash!, privateKey)

  const tokenContract = await getTokenContractFromAddress(tokenAddress)
  if (!tokenContract) {
    throw Error(`${TAG} Escrow invite used unknown token address ${tokenAddress}`)
  }

  Logger.debug(TAG + '@withdrawFromEscrowViaKomenci', `Signed message hash signature`)
  const withdrawTx = escrowWrapper.withdraw(paymentId, v, r, s)
  const transferTx = tokenContract.transfer(walletAddress, value.toString())
  return { withdrawTx, transferTx }
}

function* withdrawFromEscrow(komenciActive: boolean = false) {
  try {
    const [contractKit, walletAddress, mtwAddress]: [ContractKit, string, string] = yield all([
      call(getContractKit),
      call(getConnectedUnlockedAccount),
      select(mtwAddressSelector),
    ])

    if (!mtwAddress) {
      throw Error('No MTW found')
    }

    ValoraAnalytics.track(OnboardingEvents.escrow_redeem_start)
    Logger.debug(TAG + '@withdrawFromEscrow', 'Withdrawing escrowed payment')
    const phoneHashDetails: PhoneNumberHashDetails | undefined = yield call(
      getUserSelfPhoneHashDetails
    )

    if (!phoneHashDetails) {
      throw Error("Couldn't find own phone hash or pepper. Should never happen.")
    }

    const { phoneHash, pepper } = phoneHashDetails

    const [escrowWrapper, mtwWrapper]: [EscrowWrapper, MetaTransactionWalletWrapper] = yield all([
      call([contractKit.contracts, contractKit.contracts.getEscrow]),
      call([contractKit.contracts, contractKit.contracts.getMetaTransactionWallet], mtwAddress),
    ])

    const escrowPaymentIds: string[] = yield call(
      [escrowWrapper, escrowWrapper.getReceivedPaymentIds],
      phoneHash
    )

    if (escrowPaymentIds.length === 0) {
      Logger.debug(TAG + '@withdrawFromEscrow', 'No pending payments in escrow')
      ValoraAnalytics.track(OnboardingEvents.escrow_redeem_complete)
      return
    }

    const paymentIdSet: Set<string> = new Set(escrowPaymentIds)

    const context = newTransactionContext(TAG, 'Withdraw from escrow')
    const withdrawTxSuccess: boolean[] = []
    // Using an upper bound of 100 to be sure this doesn't run forever
    for (let i = 0; i < 100 && paymentIdSet.size > 0; i += 1) {
      const { paymentId, privateKey } = generateEscrowPaymentIdAndPk(phoneHash, pepper, i)
      if (!paymentIdSet.has(paymentId)) {
        continue
      }
      paymentIdSet.delete(paymentId)

      const receivedPayment = yield call(getEscrowedPayment, escrowWrapper, paymentId)
      const value = new BigNumber(receivedPayment[3])
      if (!value.isGreaterThan(0)) {
        Logger.warn(TAG + '@withdrawFromEscrow', 'Escrow payment is empty, skipping.')
        continue
      }

      const {
        withdrawTx,
        transferTx,
      }: {
        withdrawTx: CeloTransactionObject<boolean>
        transferTx: CeloTransactionObject<boolean>
      } = yield formEscrowWithdrawAndTransferTx(
        contractKit,
        escrowWrapper,
        paymentId,
        receivedPayment.token,
        privateKey,
        walletAddress,
        mtwAddress,
        value
      )

      const withdrawAndTransferTx = mtwWrapper.executeTransactions([withdrawTx.txo, transferTx.txo])

      try {
        if (!komenciActive) {
          yield call(sendTransaction, withdrawAndTransferTx.txo, walletAddress, context)
        } else {
          const komenci = yield select(komenciContextSelector)
          const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

          const withdrawAndTransferTxResult: Result<
            CeloTxReceipt,
            FetchError | TxError
          > = yield call(
            [komenciKit, komenciKit.submitMetaTransaction],
            mtwAddress,
            withdrawAndTransferTx
          )

          if (!withdrawAndTransferTxResult.ok) {
            throw withdrawAndTransferTxResult.error
          }
        }
        withdrawTxSuccess.push(true)
      } catch (error) {
        withdrawTxSuccess.push(false)
        Logger.error(TAG + '@withdrawFromEscrow', 'Unable to withdraw from escrow. Error: ', error)
      }
    }

    if (!withdrawTxSuccess.includes(true)) {
      throw Error('Unable to withdraw any pending escrow transactions')
    }

    yield put(fetchStableBalances())
    yield put(fetchTokenBalances())
    Logger.showMessage(i18n.t('transferDollarsToAccount'))
    ValoraAnalytics.track(OnboardingEvents.escrow_redeem_complete)
  } catch (e) {
    Logger.error(TAG + '@withdrawFromEscrow', 'Error withdrawing payment from escrow', e)
    ValoraAnalytics.track(OnboardingEvents.escrow_redeem_error, { error: e.message })
    yield put(showErrorOrFallback(e, ErrorMessages.ESCROW_WITHDRAWAL_FAILED))
  }
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

export function* watchVerificationEnd() {
  while (true) {
    const update: SetVerificationStatusAction = yield take(IdentityActions.SET_VERIFICATION_STATUS)
    const shouldUseKomenci = yield select(shouldUseKomenciSelector)
    if (update?.status === VerificationStatus.Done) {
      // We wait for the next block because escrow can not
      // be redeemed without all the attestations completed
      yield waitForNextBlock()
      yield call(withdrawFromEscrow, shouldUseKomenci)
    }
  }
}

export function* escrowSaga() {
  yield spawn(watchTransferPayment)
  yield spawn(watchReclaimPayment)
  yield spawn(watchFetchSentPayments)
  yield spawn(watchVerificationEnd)
}
