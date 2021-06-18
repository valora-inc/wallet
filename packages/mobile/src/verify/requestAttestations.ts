import { Result } from '@celo/base/lib/result'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import { Address, ContractKit } from '@celo/contractkit/lib'
import {
  ActionableAttestation,
  AttestationsWrapper,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { FetchError, TxError } from '@celo/komencikit/src/errors'
import { KomenciKit } from '@celo/komencikit/src/kit'
import { call, put, select } from 'redux-saga/effects'
import { setRetryVerificationWithForno } from 'src/account/actions'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { shortVerificationCodesEnabledSelector } from 'src/app/selectors'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { isVersionBelowMinimum } from 'src/utils/versionCheck'
import { getKomenciAwareAccount, getKomenciKit } from 'src/verify/komenci'
import {
  actionableAttestationsSelector,
  fail,
  KomenciContext,
  komenciContextSelector,
  OnChainVerificationStatus,
  phoneHashSelector,
  revealAttestations,
  RevealStatus,
  RevealStatuses,
  revealStatusesSelector,
  setActionableAttestation,
  shouldUseKomenciSelector,
  startKomenciSession,
  verificationStatusSelector,
} from 'src/verify/module'
import {
  APPROVE_ATTESTATIONS_TX_GAS,
  getActionableAttestations,
  MINIMUM_VERSION_FOR_SHORT_CODES,
  REQUEST_ATTESTATIONS_TX_GAS,
  SELECT_ISSUERS_TX_GAS,
} from 'src/verify/saga'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'verify/requestAttestations'

export function* requestAttestationsSaga() {
  const shouldUseKomenci: boolean = yield select(shouldUseKomenciSelector)
  try {
    const account: string = yield call(getKomenciAwareAccount)
    const contractKit: ContractKit = yield call(getContractKit)

    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])
    const phoneHash: string | undefined = yield select(phoneHashSelector)
    if (phoneHash === undefined) {
      yield put(fail('Phone Hash is undefined at requestAttestationsSaga'))
      return
    }

    let actionableAttestations: ActionableAttestation[] = yield select(
      actionableAttestationsSelector
    )
    const status: OnChainVerificationStatus = yield select(verificationStatusSelector)
    const revealStatuses: RevealStatuses = yield select(revealStatusesSelector)

    const alreadyRevealed = Object.values(revealStatuses).filter(
      (rS) => rS === RevealStatus.Revealed
    ).length
    const withUnknownStatus = actionableAttestations.filter((aa) => !revealStatuses[aa.issuer])
      .length
    const failedStatus = actionableAttestations.filter(
      (aa) => revealStatuses[aa.issuer] === RevealStatus.Failed
    ).length

    // Compensate failed attestations
    const numberOfAttestationsToRequest =
      status.numAttestationsRemaining - actionableAttestations.length + failedStatus

    Logger.debug(
      TAG + '@requestAttestationsSaga',
      `Out of total ${status.numAttestationsRemaining} attestations needed to complete verification: already revealed - ${alreadyRevealed}, failed - ${failedStatus}, unknown - ${withUnknownStatus}`
    )

    if (numberOfAttestationsToRequest <= 0) {
      yield put(revealAttestations())
      return
    }
    Logger.debug(TAG + '@requestAttestationsSaga', `Requesting: ${numberOfAttestationsToRequest}`)

    ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_start, {
      attestationsToRequest: numberOfAttestationsToRequest,
      feeless: shouldUseKomenci,
    })

    actionableAttestations = yield call(
      requestAndRetrieveAttestations,
      attestationsWrapper,
      phoneHash!,
      account,
      actionableAttestations,
      actionableAttestations.length + numberOfAttestationsToRequest,
      shouldUseKomenci
    )
    yield put(setActionableAttestation(actionableAttestations))

    ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_complete, {
      issuers: actionableAttestations.map((a) => a.issuer),
      feeless: shouldUseKomenci,
    })
    yield put(revealAttestations())
  } catch (e) {
    if (shouldUseKomenci) {
      yield put(startKomenciSession())
    } else {
      yield put(fail(e.message))
    }
  }
}

function* requestNewAttestations(
  attestationsWrapper: AttestationsWrapper,
  numAttestationsRequestsNeeded: number,
  phoneHash: string,
  account: string,
  shouldUseKomenci: boolean
) {
  const contractKit: ContractKit = yield call(getContractKit)
  const walletAddress: Address = yield call(getConnectedUnlockedAccount)
  const komenci: KomenciContext = yield select(komenciContextSelector)
  const komenciKit: KomenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

  if (numAttestationsRequestsNeeded <= 0) {
    Logger.debug(`${TAG}@requestAttestations`, 'No additional attestations requests needed')
    return
  }

  // Check for attestation requests that need an issuer to be selected.
  const unselectedRequest: UnselectedRequest = yield call(
    [attestationsWrapper, attestationsWrapper.getUnselectedRequest],
    phoneHash,
    account
  )

  let isUnselectedRequestValid: boolean = unselectedRequest.blockNumber !== 0
  if (isUnselectedRequestValid) {
    isUnselectedRequestValid = yield call(
      [attestationsWrapper, attestationsWrapper.isAttestationExpired],
      unselectedRequest.blockNumber
    )
  }

  // If any attestations require issuer selection, no new requests can be made
  // until the issuers are selected or the request expires.
  if (isUnselectedRequestValid) {
    Logger.debug(
      `${TAG}@requestAttestations`,
      `Valid unselected request found, skipping approval/request`
    )
  } else {
    // Approve the attestation fee to be paid from the user's cUSD account.
    Logger.debug(
      `${TAG}@requestAttestations`,
      `Approving ${numAttestationsRequestsNeeded} new attestations`
    )

    if (shouldUseKomenci) {
      Logger.debug(
        `${TAG}@requestAttestations`,
        `Approving and requesting ${numAttestationsRequestsNeeded} new attestations`
      )

      // KomenciKit `requestAttestations` method now bundles in the approve tx
      // so there is no need to approve separately
      const requestTxResult: Result<CeloTxReceipt, FetchError | TxError> = yield call(
        [komenciKit, komenciKit.requestAttestations],
        account,
        phoneHash,
        numAttestationsRequestsNeeded
      )

      if (!requestTxResult.ok) {
        Logger.debug(TAG, '@requestAttestations', 'Failed request tx')
        throw requestTxResult.error
      }
      ValoraAnalytics.track(VerificationEvents.verification_request_attestation_approve_tx_sent, {
        feeless: true,
      })

      ValoraAnalytics.track(VerificationEvents.verification_request_attestation_request_tx_sent, {
        feeless: true,
      })
    } else {
      const approveTx: CeloTransactionObject<boolean> = yield call(
        [attestationsWrapper, attestationsWrapper.approveAttestationFee],
        numAttestationsRequestsNeeded
      )

      yield call(
        sendTransaction,
        approveTx.txo,
        account,
        newTransactionContext(TAG, 'Approve attestations'),
        APPROVE_ATTESTATIONS_TX_GAS
      )

      ValoraAnalytics.track(VerificationEvents.verification_request_attestation_approve_tx_sent)

      // Request the required number of attestations.
      Logger.debug(
        `${TAG}@requestAttestations`,
        `Requesting ${numAttestationsRequestsNeeded} new attestations`
      )
      const requestTx: CeloTransactionObject<void> = yield call(
        [attestationsWrapper, attestationsWrapper.request],
        phoneHash,
        numAttestationsRequestsNeeded
      )

      yield call(
        sendTransaction,
        requestTx.txo,
        account,
        newTransactionContext(TAG, 'Request attestations'),
        REQUEST_ATTESTATIONS_TX_GAS
      )
      ValoraAnalytics.track(VerificationEvents.verification_request_attestation_request_tx_sent)
    }
  }

  // Wait for the issuer selection delay to elapse, then select issuers for the attestations.
  Logger.debug(`${TAG}@requestAttestations`, 'Waiting for block to select issuers')
  ValoraAnalytics.track(
    VerificationEvents.verification_request_attestation_await_issuer_selection,
    { feeless: shouldUseKomenci }
  )

  yield call([attestationsWrapper, attestationsWrapper.waitForSelectingIssuers], phoneHash, account)

  Logger.debug(`${TAG}@requestAttestations`, 'Selecting issuers')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_select_issuer, {
    feeless: shouldUseKomenci,
  })

  if (shouldUseKomenci) {
    const selectIssuersTxResult: Result<CeloTxReceipt, FetchError | TxError> = yield call(
      [komenciKit, komenciKit.selectIssuers],
      account,
      phoneHash
    )

    if (!selectIssuersTxResult.ok) {
      Logger.debug(TAG, '@feelessRequestAttestations', 'Failed selectIssuers tx')
      throw selectIssuersTxResult.error
    }
  } else {
    const selectIssuersTx = attestationsWrapper.selectIssuers(phoneHash)

    yield call(
      sendTransaction,
      selectIssuersTx.txo,
      account,
      newTransactionContext(TAG, 'Select attestation issuers'),
      SELECT_ISSUERS_TX_GAS
    )
  }
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_issuer_tx_sent, {
    feeless: shouldUseKomenci,
  })
}

// Requests if necessary additional attestations and returns all revealable attestations
function* requestAndRetrieveAttestations(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  account: string,
  currentActionableAttestations: ActionableAttestation[],
  attestationsNeeded: number,
  isFeelessVerification: boolean = false
) {
  const shortVerificationCodesEnabled = yield select(shortVerificationCodesEnabledSelector)

  let attestations = currentActionableAttestations

  // Any verification failure past this point will be after sending a tx
  // so do not prompt forno retry as these failures are not always
  // light client related, and account may have insufficient balance
  if (!isFeelessVerification) {
    yield put(setRetryVerificationWithForno(false))
  }

  while (attestations.length < attestationsNeeded) {
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_start, {
      currentAttestation: attestations.length,
      feeless: isFeelessVerification,
    })
    // Request any additional attestations beyond the original set
    yield call(
      requestNewAttestations,
      attestationsWrapper,
      attestationsNeeded - attestations.length,
      phoneHash,
      account,
      isFeelessVerification
    )

    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_complete, {
      feeless: isFeelessVerification,
    })

    // Check if we have a sufficient set now by fetching the new total set
    attestations = yield call(getActionableAttestations, attestationsWrapper, phoneHash, account)
    if (shortVerificationCodesEnabled) {
      // we only support attestation service 1.1.0 and above for short codes
      attestations = attestations.filter(
        (att) => !isVersionBelowMinimum(att.version, MINIMUM_VERSION_FOR_SHORT_CODES)
      )
    }
  }

  return attestations
}
