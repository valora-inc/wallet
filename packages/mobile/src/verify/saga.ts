import { Result } from '@celo/base/lib/result'
import { Address, ContractKit } from '@celo/contractkit/lib'
import {
  ActionableAttestation,
  AttestationsWrapper,
  getSecurityCodePrefix,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import {
  CheckSessionResp,
  GetDistributedBlindedPepperResp,
  StartSessionResp,
} from '@celo/komencikit/src/actions'
import {
  AuthenticationFailed,
  FetchError,
  InvalidWallet,
  KomenciDown,
  LoginSignatureError,
  NetworkError,
  NotFoundError,
  RequestError,
  ResponseDecodeError,
  ServiceUnavailable,
  TxError,
  TxEventNotFound,
  TxRevertError,
  TxTimeoutError,
  WalletValidationError,
} from '@celo/komencikit/src/errors'
import { KomenciKit } from '@celo/komencikit/src/kit'
import { verifyWallet } from '@celo/komencikit/src/verifyWallet'
import { eqAddress } from '@celo/utils/lib/address'
import { retryAsync, sleep } from '@celo/utils/lib/async'
import {
  AttestationsStatus,
  extractAttestationCodeFromMessage,
  extractSecurityCodeWithPrefix,
} from '@celo/utils/lib/attestations'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import {
  all,
  call,
  cancel as cancelTask,
  delay,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
} from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import { waitForNextBlock } from 'src/geth/saga'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { ReactBlsBlindingClient } from 'src/identity/bls-blinding-client'
import {
  hasExceededKomenciErrorQuota,
  KomenciErrorQuotaExceeded,
  KomenciSessionInvalidError,
  storeTimestampIfKomenciError,
} from 'src/identity/feelessVerificationErrors'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { e164NumberToSaltSelector, E164NumberToSaltType } from 'src/identity/reducer'

import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import { AttestationRequest } from '@celo/utils/lib/io'
import AwaitLock from 'await-lock'
import { setRetryVerificationWithForno } from 'src/account/actions'
import { setNumberVerified } from 'src/app/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import { shortVerificationCodesEnabledSelector } from 'src/app/selectors'
import { SMS_RETRIEVER_APP_SIGNATURE } from 'src/config'
import { revokeSaga } from 'src/identity/revoke'
import { getAttestationCodeForSecurityCode } from 'src/identity/securityCode'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { clearPasswordCaches } from 'src/pincode/PasswordCache'
import { waitFor } from 'src/redux/sagas-helpers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { isVersionBelowMinimum } from 'src/utils/versionCheck'
import {
  actionableAttestationsSelector,
  attestationCodesSelector,
  cancel,
  checkIfKomenciAvailable,
  completeAttestationCode,
  completeAttestations,
  completedAttestationCodesSelector,
  e164NumberSelector,
  ensureRealHumanUser,
  fail,
  fetchMtw,
  fetchOnChainData,
  fetchPhoneNumberDetails,
  inputAttestationCode,
  isBalanceSufficientForSigRetrievalSelector,
  KomenciAvailable,
  KomenciContext,
  komenciContextSelector,
  OnChainVerificationStatus,
  phoneHashSelector,
  receiveAttestationCode,
  reportRevealStatus,
  requestAttestations,
  resendMessages,
  reset,
  revealAttestations,
  RevealStatus,
  RevealStatuses,
  revealStatusesSelector,
  revoke,
  setActionableAttestation,
  setCompletedCodes,
  setKomenciAvailable,
  setKomenciContext,
  setLastRevealAttempt,
  setPhoneHash,
  setRevealStatuses,
  setVerificationStatus,
  shouldUseKomenciSelector,
  start,
  startKomenciSession,
  stop,
  succeed,
  verificationStatusSelector,
} from 'src/verify/reducer'
import { getContractKit } from 'src/web3/contracts'
import { registerWalletAndDekViaKomenci } from 'src/web3/dataEncryptionKey'
import { getAccount, getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'

const inputAttestationCodeLock = new AwaitLock()

export const NUM_ATTESTATIONS_REQUIRED = 3
// export const ESTIMATED_COST_PER_ATTESTATION = 0.051
// export const MAX_ACTIONABLE_ATTESTATIONS = 5
export const REVEAL_RETRY_DELAY = 10 * 1000 // 10 seconds

const TAG = 'verify/saga'
export const BALANCE_CHECK_TIMEOUT = 5 * 1000 // 5 seconds
const KOMENCI_READINESS_RETRIES = 3
const KOMENCI_DEPLOY_MTW_RETRIES = 3
const ANDROID_DELAY_REVEAL_ATTESTATION = 5000 // 5 sec after each
const VERIFICATION_TIMEOUT = 10 * 60 * 1000 // 10 minutes
// Using hard-coded gas value to avoid running gas estimation.
// Note: This is fragile and needs be updated if there are significant
// changes to the contract implementation.
const APPROVE_ATTESTATIONS_TX_GAS = 150000
const REQUEST_ATTESTATIONS_TX_GAS = 215000
const SELECT_ISSUERS_TX_GAS = 500000
const COMPLETE_ATTESTATION_TX_GAS = 250000
const MINIMUM_VERSION_FOR_SHORT_CODES = '1.1.0'

export interface AttestationCode {
  code: string
  shortCode?: string | null
  issuer: string
}

export enum CodeInputType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  DEEP_LINK = 'deepLink',
}

export async function getActionableAttestations(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  account: string
) {
  const attestations = await retryAsync(
    attestationsWrapper.getActionableAttestations.bind(attestationsWrapper),
    NUM_ATTESTATIONS_REQUIRED,
    [phoneHash, account]
  )
  return attestations
}

export async function getAttestationsStatus(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHash: string
): Promise<AttestationsStatus> {
  Logger.debug(TAG + '@getAttestationsStatus', 'Getting verification status from contract')

  const attestationStatus = await attestationsWrapper.getVerifiedStatus(
    phoneHash,
    account,
    NUM_ATTESTATIONS_REQUIRED
  )

  Logger.debug(
    TAG + '@getAttestationsStatus',
    `${attestationStatus.numAttestationsRemaining} verifications remaining. Total of ${attestationStatus.total} requested.`
  )

  // If the user has enough attestations completed to be considered verified but doesn't
  // have an account associated with the identifer, set `isVerified` to false
  if (attestationStatus.isVerified) {
    Logger.debug(TAG + '@getAttestationsStatus', `Account ${account} is already verified`)

    const attestedAccounts: Address[] = await attestationsWrapper.lookupAccountsForIdentifier(
      phoneHash
    )
    const associated = attestedAccounts.some((acc) => eqAddress(acc, account))

    if (!associated) {
      Logger.debug(
        TAG + '@getAttestationsStatus',
        `Account has enough completed attestations but is not associated with the identifier. Likely a revoked account`
      )
      attestationStatus.isVerified = false
    }
  }

  return attestationStatus
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
  const komenciKit: KomenciKit = new KomenciKit(contractKit, walletAddress, {
    url: komenci.callbackUrl || networkConfig.komenciUrl,
    token: komenci.sessionToken,
  })

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
export function* requestAndRetrieveAttestations(
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

    ValoraAnalytics.track(
      VerificationEvents.verification_request_all_attestations_refresh_progress,
      {
        attestationsRemaining: attestationsNeeded - attestations.length,
        feeless: isFeelessVerification,
      }
    )
  }

  return attestations
}

async function postToAttestationService(
  attestationsWrapper: AttestationsWrapper,
  attestationServiceUrl: string,
  revealRequestBody: AttestationRequest
): Promise<{ ok: boolean; status: number; body: any }> {
  Logger.debug(
    `${TAG}@postToAttestationService`,
    `Revealing with contract kit for service url ${attestationServiceUrl}`
  )
  const response = await attestationsWrapper.revealPhoneNumberToIssuer(
    attestationServiceUrl,
    revealRequestBody
  )
  const body = await response.json()
  return { ok: response.ok, status: response.status, body }
}

export function* tryRevealPhoneNumber(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation,
  isFeelessVerification: boolean
) {
  const issuer = attestation.issuer
  Logger.debug(TAG + '@tryRevealPhoneNumber', `Revealing an attestation for issuer: ${issuer}`)

  const shortVerificationCodesEnabled: boolean = yield select(shortVerificationCodesEnabledSelector)

  try {
    // Only include retriever app sig for android, iOS doesn't support auto-read
    const smsRetrieverAppSig = Platform.OS === 'android' ? SMS_RETRIEVER_APP_SIGNATURE : undefined

    const language: string = yield select(currentLanguageSelector)
    const revealRequest: AttestationRequest = {
      account,
      issuer,
      phoneNumber: phoneHashDetails.e164Number,
      salt: phoneHashDetails.pepper,
      smsRetrieverAppSig,
      language,
      securityCodePrefix: undefined,
    }

    if (shortVerificationCodesEnabled) {
      revealRequest.securityCodePrefix = getSecurityCodePrefix(issuer)
    }

    const { ok, status, body } = yield call(
      postToAttestationService,
      attestationsWrapper,
      attestation.attestationServiceURL,
      revealRequest
    )

    if (ok) {
      Logger.debug(TAG + '@tryRevealPhoneNumber', `Revealing for issuer ${issuer} successful`)
      ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_revealed, {
        neededRetry: false,
        issuer,
        feeless: isFeelessVerification,
      })
      return true
    }

    if (body.error && body.error.includes('No incomplete attestation found')) {
      // Retry as attestation service might not yet have received the block where it was made responsible for an attestation
      Logger.debug(TAG + '@tryRevealPhoneNumber', `Retrying revealing for issuer: ${issuer}`)

      yield delay(REVEAL_RETRY_DELAY)

      const { ok: retryOk, status: retryStatus } = yield call(
        postToAttestationService,
        attestationsWrapper,
        attestation.attestationServiceURL,
        revealRequest
      )

      if (retryOk) {
        Logger.debug(`${TAG}@tryRevealPhoneNumber`, `Reveal retry for issuer ${issuer} successful`)
        ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_revealed, {
          neededRetry: true,
          issuer,
          feeless: isFeelessVerification,
        })
        return true
      }

      Logger.error(
        `${TAG}@tryRevealPhoneNumber`,
        `Reveal retry for issuer ${issuer} failed with status ${retryStatus}`
      )
    }

    // Reveal is unsuccessfull, so asking the status of it from validator
    yield put(
      reportRevealStatus({
        attestationServiceUrl: attestation.attestationServiceURL,
        account,
        issuer,
        e164Number: phoneHashDetails.e164Number,
        pepper: phoneHashDetails.pepper,
      })
    )

    throw new Error(
      `Error revealing to issuer ${attestation.attestationServiceURL}. Status code: ${status}`
    )
  } catch (error) {
    // This is considered a recoverable error because the user may have received the code in a previous run
    // So instead of propagating the error, we catch it just update status. This will trigger the modal,
    // allowing the user to enter codes manually or skip verification.
    Logger.error(TAG + '@tryRevealPhoneNumber', `Reveal for issuer ${issuer} failed`, error)
    ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_error, {
      issuer,
      error: error.message,
      feeless: isFeelessVerification,
    })
    return false
  }
}

function* getCodeForIssuer(issuer: string): Generator<any, AttestationCode | undefined, any> {
  const existingCodes: AttestationCode[] = yield select(attestationCodesSelector)
  return existingCodes.find((c) => c.issuer === issuer)
}

// Get the code from the store if it's already there, otherwise wait for it
function* waitForAttestationCode(issuer: string): Generator<any, AttestationCode, any> {
  Logger.debug(TAG + '@waitForAttestationCode', `Waiting for code for issuer ${issuer}`)
  const code = yield call(getCodeForIssuer, issuer)
  if (code) {
    return code
  }

  while (true) {
    const action: ReturnType<typeof inputAttestationCode> = yield take(inputAttestationCode.type)
    if (action.payload.issuer === issuer) {
      return action.payload
    }
  }
}

// Codes that are auto-imported or pasted in quick sucsession may revert due to being submitted by Komenci
// with the same nonce as the previous code. Adding retry logic to attempt the tx again in that case
// TODO: Batch all available `complete` tranactions once Komenci supports it
function* submitCompleteTxAndRetryOnRevert(
  komenciKit: KomenciKit,
  mtwAddress: string,
  phoneHashDetails: PhoneNumberHashDetails,
  code: AttestationCode
) {
  const numOfRetries = 3
  let completeTxResult: Result<CeloTxReceipt, FetchError | TxError>
  for (let i = 0; i < numOfRetries; i += 1) {
    completeTxResult = yield call(
      [komenciKit, komenciKit.completeAttestation],
      mtwAddress,
      phoneHashDetails.phoneHash,
      code.issuer,
      code.code
    )

    if (completeTxResult.ok) {
      return completeTxResult
    }

    // If it's not a revert error, or this is the last retry, then return result
    const errorString = completeTxResult.error.toString().toLowerCase()
    if (!errorString.includes('revert') || i + 1 === numOfRetries) {
      return completeTxResult
    }

    Logger.debug(TAG, '@feelessCompleteAttestation', `Failed complete tx on retry #${i + 1}`)
    yield call(waitForNextBlock)
  }
}

export function* completeAttestation(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation,
  komenciKit: KomenciKit
) {
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)
  const issuer = attestation.issuer
  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_start, {
    issuer,
    feeless: shouldUseKomenci,
  })
  const code: AttestationCode = yield call(waitForAttestationCode, issuer)
  const existingCodes: AttestationCode[] = yield select(attestationCodesSelector)
  const codePosition = existingCodes.findIndex((existingCode) => existingCode.issuer === issuer)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_complete, {
    issuer,
    feeless: shouldUseKomenci,
  })

  Logger.debug(TAG + '@completeAttestation', `Completing code for issuer: ${code.issuer}`)

  // Make each concurrent completion attempt wait a sec for where they are relative to other codes
  // to ensure `processingInputCode` has enough time to properly gate the tx. 0-index code
  // will have 0 delay, 1-index code will have 1 sec delay, etc.
  if (shouldUseKomenci) {
    yield delay(codePosition * 1000)
    yield inputAttestationCodeLock.acquireAsync()
    const completeTxResult: Result<CeloTxReceipt, FetchError | TxError> = yield call(
      submitCompleteTxAndRetryOnRevert,
      komenciKit,
      account,
      phoneHashDetails,
      code
    )
    yield inputAttestationCodeLock.release()
    if (!completeTxResult.ok) {
      Logger.debug(TAG, '@feelessCompleteAttestation', 'Failed complete tx')
      throw completeTxResult.error
    }
  } else {
    // Generate and send the transaction to complete the attestation from the given issuer.
    const completeTx: CeloTransactionObject<void> = yield call(
      [attestationsWrapper, attestationsWrapper.complete],
      phoneHashDetails.phoneHash,
      account,
      code.issuer,
      code.code
    )
    const context = newTransactionContext(TAG, `Complete attestation from ${issuer}`)
    yield call(sendTransaction, completeTx.txo, account, context, COMPLETE_ATTESTATION_TX_GAS)
  }

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_complete, {
    issuer,
    feeless: shouldUseKomenci,
  })

  // Report reveal status from validator
  yield put(
    reportRevealStatus({
      attestationServiceUrl: attestation.attestationServiceURL,
      account,
      issuer,
      e164Number: phoneHashDetails.e164Number,
      pepper: phoneHashDetails.pepper,
    })
  )
  Logger.debug(TAG + '@completeAttestation', `Attestation for issuer ${issuer} completed`)
  yield put(completeAttestationCode(code))
}

function* checkTooManyErrors() {
  const komenci: KomenciContext = yield select(komenciContextSelector)
  if (hasExceededKomenciErrorQuota(komenci.errorTimestamps)) {
    Logger.debug(TAG, '@fetchKomenciReadiness', 'Too  many errors')
    throw new KomenciErrorQuotaExceeded()
  }
}

export function* fetchKomenciReadiness(komenciKit: KomenciKit) {
  for (let i = 0; i < KOMENCI_READINESS_RETRIES; i += 1) {
    const serviceStatusResult: Result<true, KomenciDown> = yield call([
      komenciKit,
      komenciKit.checkService,
    ])

    if (!serviceStatusResult.ok) {
      Logger.debug(TAG, '@fetchKomenciReadiness', 'Komenci service is down')
      yield call(checkTooManyErrors)
      if (serviceStatusResult.error instanceof KomenciDown) {
        yield sleep(2 ** i * 5000)
      } else {
        throw serviceStatusResult.error
      }
    }
  }

  return true
}

export function* fetchKomenciSession(komenciKit: KomenciKit, e164Number: string) {
  Logger.debug(TAG, '@fetchKomenciSession', 'Starting fetch')
  const [komenciContext, pepperCache, sessionStatusResult]: [
    KomenciContext,
    E164NumberToSaltType,
    Result<CheckSessionResp, FetchError>
  ] = yield all([
    select(komenciContextSelector),
    select(e164NumberToSaltSelector),
    call([komenciKit, komenciKit.checkSession]),
  ])

  let sessionActive = true
  let { unverifiedMtwAddress } = komenciContext

  // An inactive session is not fatal, it just means we will need to start one
  if (!sessionStatusResult.ok) {
    Logger.debug(TAG, '@fetchKomenciSession', 'No active sessions')
    sessionActive = false
  } else {
    Logger.debug(TAG, '@fetchKomenciSession', 'Active session found')
    const {
      quotaLeft: { distributedBlindedPepper, requestSubsidisedAttestation, submitMetaTransaction },
      metaTxWalletAddress,
    } = sessionStatusResult.result
    const ownPepper = pepperCache[e164Number]

    Logger.debug(
      TAG,
      '@fetchKomenciSession Session status:',
      JSON.stringify(sessionStatusResult.result)
    )

    // Sometimes `metaTxWalletAddress` is returned as undefined for an active session.
    // In that case, use the `unverifiedMtwAddress` we have stored locally
    unverifiedMtwAddress = metaTxWalletAddress ?? unverifiedMtwAddress

    // No pepper quota remaining is only bad if it's not already cached. Given Komenci will fetch
    // a pepper for you once, a session could be invalid due to the pepper condition if a user
    // fetched their pepper once this session then uninstalled without starting a new session
    if (
      (!ownPepper && !distributedBlindedPepper) ||
      !requestSubsidisedAttestation ||
      !submitMetaTransaction
    ) {
      Logger.debug(
        TAG,
        '@fetchKomenciSession',
        'Komenci session has run out of quota. Will attempt to start a new one'
      )
      sessionActive = false
    }
  }

  yield put(setKomenciContext({ unverifiedMtwAddress, sessionActive }))
}

function* startOrResumeKomenciSessionSaga() {
  // TODO: Move this out of saga
  yield call(navigate, Screens.VerificationLoadingScreen)

  Logger.debug(TAG, '@startOrResumeKomenciSession', 'Starting session')

  const contractKit: ContractKit = yield call(getContractKit)
  const walletAddress: Address = yield call(getConnectedUnlockedAccount)
  const komenci: KomenciContext = yield select(komenciContextSelector)
  const komenciKit: KomenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

  const { sessionActive, captchaToken } = komenci
  let { sessionToken } = komenci

  // If there isn't an active session, start one. Need to include `sessionActive`
  // because that's the only way we'll know if Komenci session is active but
  // quota is used
  if (!sessionActive || !sessionToken.length) {
    // Should never get here without a captcha token
    if (!captchaToken.length) {
      const error = new KomenciSessionInvalidError()
      Logger.error(TAG, '@startOrResumeKomenciSession', error)
      throw error
    }

    const komenciSessionResult: Result<
      StartSessionResp,
      FetchError | AuthenticationFailed | LoginSignatureError
    > = yield call([komenciKit, komenciKit.startSession], captchaToken)

    if (!komenciSessionResult.ok) {
      Logger.debug(TAG, '@startOrResumeKomenciSession', 'Unable to start session')
      throw komenciSessionResult.error
    }

    sessionToken = komenciSessionResult.result.token

    yield put(
      setKomenciContext({
        sessionToken: komenciSessionResult.result.token,
        callbackUrl: komenciSessionResult.result.callbackUrl || '',
        sessionActive: true,
      })
    )
  }

  Logger.debug(TAG, 'Session active. sessionToken: ', sessionToken)
  yield put(fetchPhoneNumberDetails())
}

export function getKomenciKit(
  contractKit: ContractKit,
  walletAddress: Address,
  komenci: KomenciContext
) {
  return new KomenciKit(contractKit, walletAddress, {
    url: komenci.callbackUrl || networkConfig.komenciUrl,
    token: komenci.sessionToken,
  })
}

export function* checkIfKomenciAvailableSaga() {
  Logger.debug(TAG, '@checkIfKomenciAvailableSaga')
  const contractKit: ContractKit = yield call(getContractKit)
  const walletAddress: Address = yield call(getAccount)
  const komenci: KomenciContext = yield select(komenciContextSelector)
  const komenciKit: KomenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

  const isKomenciAvailable: boolean = yield call(fetchKomenciReadiness, komenciKit)
  yield put(setKomenciAvailable(isKomenciAvailable ? KomenciAvailable.Yes : KomenciAvailable.No))
}

export function* startSaga() {
  try {
    const contractKit = yield call(getContractKit)
    const walletAddress = yield call(getConnectedUnlockedAccount)

    Logger.debug(TAG, '@startSaga', walletAddress)
    // we want to reset password before force unlock account
    clearPasswordCaches()
    const result: UnlockResult = yield call(unlockAccount, walletAddress, true)
    if (result !== UnlockResult.SUCCESS) {
      // This navigateBack has no effect if part of onboarding and returns to home or
      // settings page if the user pressed on the back button when prompted for the PIN.
      navigateBack()
      return
    }
    const e164Number = yield select(e164NumberSelector)
    const shouldUseKomenci = yield select(shouldUseKomenciSelector)

    if (shouldUseKomenci) {
      try {
        const komenci = yield select(komenciContextSelector)
        const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)
        yield call(fetchKomenciSession, komenciKit, e164Number)
        if (!komenci.sessionActive) {
          yield put(ensureRealHumanUser())
        } else {
          // TODO: Move this out of saga
          yield call(navigate, Screens.VerificationLoadingScreen)
          yield put(fetchPhoneNumberDetails())
        }
      } catch (e) {
        Logger.error(TAG, '@startSaga', e)
        storeTimestampIfKomenciError(e)
        if (e instanceof KomenciErrorQuotaExceeded) {
          yield put(setKomenciAvailable(KomenciAvailable.No))
          yield put(start({ e164Number }))
        }
      }
    } else {
      const { timeout } = yield race({
        balances: all([
          call(waitFor, stableTokenBalanceSelector),
          call(waitFor, celoTokenBalanceSelector),
        ]),
        timeout: delay(BALANCE_CHECK_TIMEOUT),
      })
      if (timeout) {
        Logger.debug(TAG, '@startSaga', 'Token balances is null or undefined')
        yield put(fail(ErrorMessages.VERIFICATION_FAILURE))
        return
      }
      const isBalanceSufficientForSigRetrieval = yield select(
        isBalanceSufficientForSigRetrievalSelector
      )
      if (!isBalanceSufficientForSigRetrieval) {
        Logger.debug(TAG, '@startSaga', 'Insufficient balance for sig retrieval')
        yield put(fail(ErrorMessages.VERIFICATION_FAILURE))
        return
      }
      yield put(fetchPhoneNumberDetails())
    }
  } catch (error) {
    Logger.error(TAG, '@startSaga', error)
    if (error.message === ErrorMessages.PIN_INPUT_CANCELED) {
      // This navigateBack has no effect if part of onboarding and returns to home or
      // settings page if the user pressed on the back button when prompted for the PIN.
      navigateBack()
      return
    } else {
      yield put(fail(ErrorMessages.VERIFICATION_FAILURE))
    }
  }
}

export function* fetchPhoneNumberDetailsSaga() {
  Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Starting fetch')
  const e164Number = yield select(e164NumberSelector)
  let phoneHash = yield select(phoneHashSelector)
  const pepperCache = yield select(e164NumberToSaltSelector)
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)
  let ownPepper = pepperCache[e164Number]

  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', walletAddress)

  try {
    if (phoneHash && ownPepper) {
      Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Phone Hash and Pepper is cached')
    } else {
      if (!ownPepper) {
        Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Pepper not cached')
        if (shouldUseKomenci) {
          Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Fetching from Komenci')

          const komenci = yield select(komenciContextSelector)
          const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

          const blsBlindingClient = new ReactBlsBlindingClient(networkConfig.odisPubKey)
          const pepperQueryResult: Result<GetDistributedBlindedPepperResp, FetchError> = yield call(
            [komenciKit, komenciKit.getDistributedBlindedPepper],
            e164Number,
            DeviceInfo.getVersion(),
            blsBlindingClient
          )

          if (!pepperQueryResult.ok) {
            Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Unable to query for pepper')
            throw pepperQueryResult.error
          }
          ownPepper = pepperQueryResult.result.pepper
          phoneHash = getPhoneHash(e164Number, ownPepper)
        } else {
          const phoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
          ownPepper = phoneNumberHashDetails.pepper
          phoneHash = phoneNumberHashDetails.phoneHash
        }
        Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Pepper is fetched')
        Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Phone Hash is set')
        yield put(updateE164PhoneNumberSalts({ [e164Number]: ownPepper }))
        yield put(setPhoneHash(phoneHash))
      }

      // in case of pepper has been cached, but phoneHash is not
      if (!phoneHash) {
        phoneHash = getPhoneHash(e164Number, ownPepper)
        yield put(setPhoneHash(phoneHash))
        Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Phone Hash is set')
      }
      ValoraAnalytics.track(VerificationEvents.verification_hash_retrieved, {
        phoneHash,
        address: walletAddress,
      })
    }
  } catch (error) {
    yield put(fail(error.message))
    return
  }

  if (shouldUseKomenci) {
    yield put(fetchMtw())
  } else {
    yield put(fetchOnChainData())
  }
}

function* fetchVerifiedMtw(contractKit: ContractKit, walletAddress: string) {
  Logger.debug(TAG, '@fetchVerifiedMtw', 'Starting fetch')
  const phoneHash = yield select(phoneHashSelector)

  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])

  const associatedAccounts: string[] = yield call(
    [attestationsWrapper, attestationsWrapper.lookupAccountsForIdentifier],
    phoneHash
  )

  const accountAttestationStatuses: AttestationsStatus[] = yield all(
    associatedAccounts.map((account) =>
      call(getAttestationsStatus, attestationsWrapper, account, phoneHash)
    )
  )

  const possibleMtwAddressIndexes: number[] = associatedAccounts
    .map((_, i) => i)
    .filter((i) => accountAttestationStatuses[i].isVerified)

  if (!possibleMtwAddressIndexes.length) {
    Logger.debug(TAG, '@fetchVerifiedMtw', 'No possible MTWs found')
    return null
  }

  const verificationResults: Array<Result<true, WalletValidationError>> = yield all(
    possibleMtwAddressIndexes.map((possibleMtwAddressIndex) =>
      call(
        verifyWallet,
        contractKit,
        associatedAccounts[possibleMtwAddressIndex],
        networkConfig.allowedMtwImplementations,
        walletAddress
      )
    )
  )

  const verifiedMtwAddressIndexes = possibleMtwAddressIndexes.filter(
    (_, i) => verificationResults[i].ok
  )

  if (verifiedMtwAddressIndexes.length > 1) {
    yield put(
      fail('More than one verified MTW with walletAddress as signer found. Should never happen')
    )
    return
  }
  if (!verifiedMtwAddressIndexes.length) {
    Logger.debug(TAG, '@fetchVerifiedMtw', 'No verified MTW found')
    return null
  }

  const verifiedMtwAddress = associatedAccounts[verifiedMtwAddressIndexes[0]]
  const verifiedMtwStatus = accountAttestationStatuses[verifiedMtwAddressIndexes[0]]

  yield put(
    setKomenciContext({
      unverifiedMtwAddress: verifiedMtwAddress,
    })
  )
  yield put(setVerificationStatus(verifiedMtwStatus))

  return verifiedMtwAddress
}

export function* fetchOrDeployMtwSaga() {
  const e164Number = yield select(e164NumberSelector)
  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  const komenci = yield select(komenciContextSelector)
  const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

  try {
    // Now that we are guarnateed to have the phoneHash, check again to see if the
    // user already has a verified MTW
    const verifiedMtwAddress = yield call(fetchVerifiedMtw, contractKit, walletAddress)
    if (verifiedMtwAddress) {
      // TODO: Address this
      // yield put(doVerificationFlow(true))
      return
    }

    Logger.debug(TAG, '@fetchOrDeployMtwSaga', 'Starting fetch')
    const storedUnverifiedMtwAddress = komenci.unverifiedMtwAddress
    let deployedUnverifiedMtwAddress: string | null = null
    // If there isn't a MTW stored for this session, ask Komenci to deploy one
    if (!storedUnverifiedMtwAddress) {
      for (let i = 0; i < KOMENCI_DEPLOY_MTW_RETRIES; i += 1) {
        // This try/catch block is a workaround because Komenci will throw an error
        // if a wallet was already deployed in a session. This is only fatal if
        // we can't recover the MTW address or there is no quota left on the session
        try {
          const deployWalletResult: Result<
            string,
            FetchError | TxError | InvalidWallet
          > = yield call(
            [komenciKit, komenciKit.deployWallet],
            networkConfig.currentMtwImplementationAddress
          )

          if (!deployWalletResult.ok) {
            Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to deploy MTW')
            throw deployWalletResult.error
          }
          deployedUnverifiedMtwAddress = deployWalletResult.result
          break
        } catch (e) {
          storeTimestampIfKomenciError(e)

          switch (true) {
            case e instanceof ServiceUnavailable:
            case e instanceof NetworkError:
            case e instanceof RequestError:
            case e instanceof NotFoundError:
            case e instanceof ResponseDecodeError:
            case e instanceof TxTimeoutError:
            case e instanceof TxRevertError:
            case e instanceof TxEventNotFound:
              continue

            case e instanceof InvalidWallet:
            default:
              put(setKomenciAvailable(KomenciAvailable.No))
              put(start({ e164Number }))
              return
          }
        }
      }
    }

    const unverifiedMtwAddress = deployedUnverifiedMtwAddress ?? storedUnverifiedMtwAddress

    // If we couldn't recover or deploy a new the MTW address, then propogate the Komenci error
    // we recevied from the failed `deployWallet` call. We also need to check if the session
    // is still active because it's possible the current session ran out of quota
    if (!unverifiedMtwAddress || !komenci.sessionActive) {
      Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to deploy or recover a MTW')
      // The new error on the RHS is mostly to placate the linting rules.
      // There should be no instances where Komenci is unable to deploy
      // a MTW yet doesn't return an error
      throw new Error('Unable to deploy or recover a MTW')
    }

    // Check if the MTW we have is a valid implementation
    const validityCheckResult: Result<true, WalletValidationError> = yield call(
      verifyWallet,
      contractKit,
      unverifiedMtwAddress,
      networkConfig.allowedMtwImplementations,
      walletAddress
    )

    if (!validityCheckResult.ok) {
      Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to validate MTW implementation')
      throw validityCheckResult.error
    }

    yield put(setKomenciContext({ unverifiedMtwAddress }))
    yield call(feelessDekAndWalletRegistration, komenciKit, walletAddress, unverifiedMtwAddress)
    yield put(fetchOnChainData())
  } catch (e) {
    storeTimestampIfKomenciError(e)
    put(setKomenciAvailable(KomenciAvailable.No))
    put(start(e164Number))
  }
}

function* feelessDekAndWalletRegistration(
  komenciKit: KomenciKit,
  walletAddress: string,
  unverifiedMtwAddress: string
) {
  Logger.debug(TAG, '@feelessDekAndWalletRegistration', 'Starting registration')

  // Should never happen
  if (!unverifiedMtwAddress) {
    throw Error('Tried registering DEK and walletAddress without a MTW')
  }

  yield call(registerWalletAndDekViaKomenci, komenciKit, unverifiedMtwAddress, walletAddress)
}

export function* fetchOnChainDataSaga() {
  try {
    Logger.debug(TAG, '@fetchOnChainDataSaga', 'Starting fetch')
    const contractKit = yield call(getContractKit)
    const shouldUseKomenci = yield select(shouldUseKomenciSelector)
    const phoneHash = yield select(phoneHashSelector)
    let account: Address
    if (shouldUseKomenci) {
      Logger.debug(TAG, '@fetchOnChainDataSaga', 'Using Komenci')
      const komenci = yield select(komenciContextSelector)

      const { unverifiedMtwAddress } = komenci

      // If there isn't an address stored in state or we already know that the
      // MTW is verified, then there is nothing to check the progress of
      if (!unverifiedMtwAddress) {
        throw Error('unverifiedMtwAddress is not set')
      }
      account = unverifiedMtwAddress
    } else {
      Logger.debug(TAG, '@fetchOnChainDataSaga', 'Using Classic')
      account = yield call(getAccount)
    }
    Logger.debug(TAG, '@fetchOnChainDataSaga', 'Account to fetch: ' + account)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])

    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsWrapper,
      account,
      phoneHash
    )

    Logger.debug(TAG, '@fetchOnChainDataSaga', 'Fetched status')
    yield put(setVerificationStatus(status))

    // If attestation status has more than one completed attestation, then the account
    // must be assoicated with identifier. Otherwise, it is likely an account that
    // has been revoked and cannot currently be reverified
    if (status.completed > 0) {
      const associatedAccounts: Address[] = yield call(
        [attestationsWrapper, attestationsWrapper.lookupAccountsForIdentifier],
        phoneHash
      )
      const associated = associatedAccounts.some((acc) => eqAddress(acc, account))
      if (!associated) {
        yield put(showError(ErrorMessages.CANT_VERIFY_REVOKED_ACCOUNT, 10000))
        yield put(fail(ErrorMessages.CANT_VERIFY_REVOKED_ACCOUNT))
        return
      }
    }

    const actionableAttestations: ActionableAttestation[] = yield call(
      getActionableAttestations,
      attestationsWrapper,
      phoneHash,
      account
    )
    Logger.debug(TAG, '@fetchOnChainDataSaga', 'Fetched actionable attestations')
    yield put(setActionableAttestation(actionableAttestations))

    yield put(setCompletedCodes(status.completed))

    yield put(requestAttestations())
  } catch (error) {
    Logger.error(TAG, '@fetchOnChainDataSaga', error)
    yield put(fail(ErrorMessages.VERIFICATION_FAILURE))
  }
}

function* getKomenciAwareAccount() {
  const komenci: KomenciContext = yield select(komenciContextSelector)
  const { unverifiedMtwAddress } = komenci
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)
  return shouldUseKomenci && unverifiedMtwAddress
    ? unverifiedMtwAddress
    : yield call(getConnectedUnlockedAccount)
}

export function* getPhoneHashDetails() {
  const pepperCache = yield select(e164NumberToSaltSelector)
  const phoneHash = yield select(phoneHashSelector)
  const e164Number = yield select(e164NumberSelector)
  const pepper = pepperCache[e164Number]

  return {
    e164Number,
    phoneHash,
    pepper,
  }
}

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
    // Request attestations with status != Revealed or without a status at all
    const alreadyRevealed = Object.values(revealStatuses).filter(
      (rS) => rS === RevealStatus.Revealed
    ).length
    const failedStatus = actionableAttestations.filter(
      (aa) => revealStatuses[aa.issuer] === RevealStatus.Failed
    ).length
    const unknownStatus = actionableAttestations.filter((aa) => !revealStatuses[aa.issuer]).length
    const numberOfAttestationsToRequest =
      status.numAttestationsRemaining - alreadyRevealed - unknownStatus
    Logger.debug(
      TAG + '@requestAttestationsSaga',
      `Out of total ${status.numAttestationsRemaining} attestations needed to complete verification: already revealed - ${alreadyRevealed}, failed - ${failedStatus}, unknown - ${unknownStatus}`
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
    const issuers = actionableAttestations.map((a) => a.issuer)
    yield put(setActionableAttestation(actionableAttestations))

    ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_complete, {
      issuers,
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

export function* revealAttestationsSaga() {
  const shouldUseKomenci: boolean = yield select(shouldUseKomenciSelector)
  const account: string = yield call(getKomenciAwareAccount)
  const contractKit: ContractKit = yield call(getContractKit)
  let revealStatuses: RevealStatuses = yield select(revealStatusesSelector)
  const actionableAttestations: ActionableAttestation[] = yield select(
    actionableAttestationsSelector
  )
  const status: OnChainVerificationStatus = yield select(verificationStatusSelector)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])
  const phoneHashDetails: PhoneNumberHashDetails = yield call(getPhoneHashDetails)

  const notRevealedActionableAttestations = actionableAttestations.filter(
    (aa) => !revealStatuses[aa.issuer] || revealStatuses[aa.issuer] === RevealStatus.NotRevealed
  )
  Logger.debug(
    TAG + '@revealAttestationsSaga',
    `Revealing ${notRevealedActionableAttestations.length} of ${actionableAttestations.length} actionable attestations`
  )
  for (const attestation of notRevealedActionableAttestations) {
    const issuer = attestation.issuer
    ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_start, {
      issuer,
      feeless: shouldUseKomenci,
    })
    const success: boolean = yield call(
      tryRevealPhoneNumber,
      attestationsWrapper,
      account,
      phoneHashDetails,
      attestation,
      shouldUseKomenci
    )
    yield put(
      setRevealStatuses({ [issuer]: success ? RevealStatus.Revealed : RevealStatus.Failed })
    )

    // TODO (i1skn): remove this clause when
    // https://github.com/celo-org/celo-monorepo/issues/6262 is resolved
    // This sends messages with 5000ms delay on Android if reveals is successful
    if (success && Platform.OS === 'android') {
      Logger.debug(
        TAG + '@revealAttestationsSaga',
        `Delaying the next one for: ${ANDROID_DELAY_REVEAL_ATTESTATION}ms`
      )
      yield delay(ANDROID_DELAY_REVEAL_ATTESTATION)
    }
  }

  yield put(setLastRevealAttempt(Date.now()))
  revealStatuses = yield select(revealStatusesSelector)

  const revealedActionableAttestations = actionableAttestations.filter(
    (aa) => revealStatuses[aa.issuer] === RevealStatus.Revealed
  )
  if (revealedActionableAttestations.length >= status.numAttestationsRemaining) {
    yield put(completeAttestations())
  } else {
    yield put(requestAttestations())
  }
}

export function* completeAttestationsSaga() {
  const account: string = yield call(getKomenciAwareAccount)
  const contractKit: ContractKit = yield call(getContractKit)
  const actionableAttestations: ActionableAttestation[] = yield select(
    actionableAttestationsSelector
  )
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])
  const phoneHashDetails = yield call(getPhoneHashDetails)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  const komenci = yield select(komenciContextSelector)
  const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

  yield all(
    actionableAttestations.map((attestation) => {
      return call(
        completeAttestation,
        attestationsWrapper,
        account,
        phoneHashDetails,
        attestation,
        komenciKit
      )
    })
  )

  yield put(succeed())
}

export function* resendMessagesSaga() {
  Logger.error(TAG, `@resendMessagesSaga has started`)
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)
  const status = yield select(verificationStatusSelector)
  ValoraAnalytics.track(VerificationEvents.verification_resend_messages, {
    count: status.numAttestationsRemaining,
    feeless: shouldUseKomenci,
  })

  const revealStatuses = yield select(revealStatusesSelector)
  const numberOfAttestationsToRequest =
    status.numAttestationsRemaining -
    Object.values(revealStatuses).filter((rS) => rS === RevealStatus.Revealed).length
  if (numberOfAttestationsToRequest <= 0) {
    return yield put(revealAttestations())
  }
  const actionableAttestations: ActionableAttestation[] = yield select(
    actionableAttestationsSelector
  )
  const revealStatusesToUpdate: Record<Address, RevealStatus> = {}
  // Reset reveal statuses for all actionable attestations
  for (const actionableAttestation of actionableAttestations) {
    revealStatusesToUpdate[actionableAttestation.issuer] = RevealStatus.NotRevealed
  }
  yield put(setRevealStatuses(revealStatusesToUpdate))
  yield put(revealAttestations())
}

export function* failSaga(action: ReturnType<typeof fail>) {
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)
  Logger.error(TAG, `@failSaga: ${action.payload}`)
  ValoraAnalytics.track(VerificationEvents.verification_error, {
    feeless: shouldUseKomenci,
    error: action.payload,
  })
}

export function* resetSaga() {
  const e164Number = yield select(e164NumberSelector)
  Logger.debug(TAG, `@resetSaga: Reset verification for ${e164Number}`)
  Logger.debug(TAG, `@resetSaga: Reseting pepper`)
  yield put(updateE164PhoneNumberSalts({ [e164Number]: null }))
}

export function* stopSaga() {
  Logger.error(TAG, `@stopSaga called`)
  // TODO: Move this out of saga
  yield call(navigate, Screens.VerificationEducationScreen, {})
}

export function* successSaga() {
  Logger.error(TAG, `@successSaga called`)
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)
  ValoraAnalytics.track(VerificationEvents.verification_complete, { feeless: shouldUseKomenci })
  Logger.debug(TAG, 'Verification completed successfully')
  yield put(setNumberVerified(true))
}

export function* receiveAttestationCodeSaga(action: ReturnType<typeof receiveAttestationCode>) {
  Logger.error(TAG, `@receiveAttestationCodeSaga called`)
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)

  if (!action.payload.message) {
    Logger.error(TAG + '@attestationCodeReceiver', 'Received empty code. Ignoring.')
    ValoraAnalytics.track(VerificationEvents.verification_code_received, {
      context: 'Empty code',
      feeless: shouldUseKomenci,
    })
    return
  }

  const actionableAttestations: ActionableAttestation[] = yield select(
    actionableAttestationsSelector
  )
  const account: string = yield call(getKomenciAwareAccount)
  const contractKit: ContractKit = yield call(getContractKit)

  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])
  const phoneHashDetails: PhoneNumberHashDetails = yield call(getPhoneHashDetails)

  const allIssuers = actionableAttestations.map((a) => a.issuer)
  let securityCodeWithPrefix: string | null = null
  let message: string = action.payload.message

  try {
    securityCodeWithPrefix = extractSecurityCodeWithPrefix(message)
    const signer: Address = yield call(getConnectedUnlockedAccount)
    if (securityCodeWithPrefix) {
      message = yield call(
        getAttestationCodeForSecurityCode,
        attestationsWrapper,
        phoneHashDetails,
        account,
        actionableAttestations,
        securityCodeWithPrefix,
        signer
      )
    } else {
      Logger.error(TAG + '@attestationCodeReceiver', 'No security code in received message')
    }

    const attestationCode = message && extractAttestationCodeFromMessage(message)

    if (!attestationCode) {
      throw new Error('No code extracted from message')
    }

    const existingCodes: AttestationCode[] = yield select(completedAttestationCodesSelector)
    const existingCode = existingCodes.find((c) => c.code === attestationCode)

    if (existingCode) {
      Logger.warn(TAG + '@attestationCodeReceiver', 'Code already exists in store, skipping.')
      ValoraAnalytics.track(VerificationEvents.verification_code_received, {
        context: 'Code already exists',
        feeless: shouldUseKomenci,
      })
      if (
        CodeInputType.MANUAL === action.payload.inputType ||
        CodeInputType.DEEP_LINK === action.payload.inputType
      ) {
        yield put(showError(ErrorMessages.REPEAT_ATTESTATION_CODE))
      }
      return
    }
    ValoraAnalytics.track(VerificationEvents.verification_code_received, {
      feeless: shouldUseKomenci,
    })
    const issuer: Address = yield call(
      [attestationsWrapper, attestationsWrapper.findMatchingIssuer],
      phoneHashDetails.phoneHash,
      account,
      attestationCode,
      allIssuers
    )
    if (!issuer) {
      throw new Error('No issuer found for attestion code')
    }

    Logger.debug(TAG + '@attestationCodeReceiver', `Received code for issuer ${issuer}`)

    ValoraAnalytics.track(VerificationEvents.verification_code_validate_start, {
      issuer,
      feeless: shouldUseKomenci,
    })
    const isValidRequest: boolean = yield call(
      [attestationsWrapper, attestationsWrapper.validateAttestationCode],
      phoneHashDetails.phoneHash,
      account,
      issuer,
      attestationCode
    )
    ValoraAnalytics.track(VerificationEvents.verification_code_validate_complete, {
      issuer,
      feeless: shouldUseKomenci,
    })

    if (!isValidRequest) {
      throw new Error('Code is not valid')
    }

    yield put(
      inputAttestationCode({ code: attestationCode, shortCode: securityCodeWithPrefix, issuer })
    )
  } catch (error) {
    Logger.error(TAG + '@attestationCodeReceiver', 'Error processing attestation code', error)
    yield put(showError(ErrorMessages.INVALID_ATTESTATION_CODE))
  }
}

export function* reportActionableAttestationsStatuses() {
  const account: string = yield call(getConnectedUnlockedAccount)
  const contractKit = yield call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])
  const phoneHashDetails = yield call(getPhoneHashDetails)
  const actionableAttestations: ActionableAttestation[] = yield call(
    getActionableAttestations,
    attestationsWrapper,
    phoneHashDetails.phoneHash,
    account
  )

  for (const attestation of actionableAttestations) {
    yield put(
      reportRevealStatus({
        attestationServiceUrl: attestation.attestationServiceURL,
        account,
        issuer: attestation.issuer,
        e164Number: phoneHashDetails.e164Number,
        pepper: phoneHashDetails.pepper,
      })
    )
  }
}

// Report to analytics reveal status from validator
export function* reportRevealStatusSaga({
  payload: { attestationServiceUrl, e164Number, account, issuer, pepper },
}: ReturnType<typeof reportRevealStatus>) {
  let aggregatedResponse: undefined | { ok: boolean; status: number; body: any }
  const contractKit = yield call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])
  Logger.debug(`${TAG}@reportRevealStatusSaga`, `Start for service url ${attestationServiceUrl}`)
  try {
    const response = yield call(
      attestationsWrapper.getRevealStatus,
      e164Number,
      account,
      issuer,
      attestationServiceUrl,
      pepper
    )
    const body = yield call(response.json.bind(response))
    aggregatedResponse = { ok: response.ok, body, status: response.status }
  } catch (error) {
    Logger.error(`${TAG}@reportRevealStatusSaga`, 'Error calling proxyRevealStatus', error)
    aggregatedResponse = { ok: false, status: 500, body: error }
  }
  if (aggregatedResponse.ok) {
    Logger.debug(
      `${TAG}@reportRevealStatusSaga`,
      `Successful for service url ${attestationServiceUrl}`
    )
    ValoraAnalytics.track(
      VerificationEvents.verification_reveal_attestation_status,
      aggregatedResponse.body
    )
  } else {
    Logger.debug(
      `${TAG}@reportRevealStatusSaga`,
      `Failed for service url ${attestationServiceUrl} with Status: ${aggregatedResponse.status}`
    )
  }
}

export function* verifySaga() {
  while (true) {
    const task = yield fork(function*() {
      Logger.debug(TAG, 'Verification Saga has started')
      yield takeEvery(checkIfKomenciAvailable.type, checkIfKomenciAvailableSaga)
      yield takeEvery(start.type, startSaga)
      yield takeEvery(startKomenciSession.type, startOrResumeKomenciSessionSaga)
      yield takeEvery(fetchPhoneNumberDetails.type, fetchPhoneNumberDetailsSaga)
      yield takeEvery(fetchMtw.type, fetchOrDeployMtwSaga)
      yield takeEvery(fetchOnChainData.type, fetchOnChainDataSaga)
      yield takeEvery(fail.type, failSaga)
      yield takeEvery(reset.type, resetSaga)
      yield takeEvery(stop.type, stopSaga)
      yield takeEvery(succeed.type, successSaga)
      yield takeEvery(requestAttestations.type, requestAttestationsSaga)
      yield takeEvery(revealAttestations.type, revealAttestationsSaga)
      yield takeEvery(completeAttestations.type, completeAttestationsSaga)
      yield takeEvery(resendMessages.type, resendMessagesSaga)
      yield takeEvery(receiveAttestationCode.type, receiveAttestationCodeSaga)
      yield takeEvery(reportRevealStatus.type, reportRevealStatusSaga)
      yield takeEvery(revoke.type, revokeSaga)
    })
    const { cancelled, timedOut }: { cancelled: boolean; timedOut: boolean } = yield race({
      cancelled: take(cancel.type),
      timedOut: delay(VERIFICATION_TIMEOUT),
    })
    const shouldUseKomenci = yield select(shouldUseKomenciSelector)

    if (cancelled) {
      yield cancelTask(task)
      Logger.debug(TAG, 'Verification has been cancelled')
      ValoraAnalytics.track(VerificationEvents.verification_cancel, { feeless: shouldUseKomenci })
    } else if (timedOut) {
      ValoraAnalytics.track(VerificationEvents.verification_timeout, { feeless: shouldUseKomenci })
      Logger.debug(TAG, 'Verification timed out')
      yield put(showError(ErrorMessages.VERIFICATION_TIMEOUT))
    }
    yield call(reportActionableAttestationsStatuses)
  }
}
