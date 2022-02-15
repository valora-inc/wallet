import { eqAddress, Result } from '@celo/base'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import { Address } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper,
  getSecurityCodePrefix,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { retryAsync } from '@celo/utils/lib/async'
import {
  AttestationsStatus,
  extractAttestationCodeFromMessage,
  extractSecurityCodeWithPrefix,
} from '@celo/utils/lib/attestations'
import { AttestationRequest } from '@celo/utils/lib/io'
import { FetchError, TxError } from '@komenci/kit/lib/errors'
import { KomenciKit } from '@komenci/kit/lib/kit'
import AwaitLock from 'await-lock'
import { Platform } from 'react-native'
import { Task } from 'redux-saga'
import {
  all,
  call,
  delay,
  fork,
  put,
  race,
  select,
  spawn,
  take,
  takeEvery,
} from 'redux-saga/effects'
import { setRetryVerificationWithForno } from 'src/account/actions'
import { e164NumberSelector } from 'src/account/selectors'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { logPhoneNumberTypeEnabledSelector } from 'src/app/selectors'
import { CodeInputStatus } from 'src/components/CodeInput'
import { isE2EEnv, SMS_RETRIEVER_APP_SIGNATURE } from 'src/config'
import { waitForNextBlock } from 'src/geth/saga'
import { currentLanguageSelector } from 'src/i18n/selectors'
import {
  Actions,
  CancelVerificationAction,
  completeAttestationCode,
  inputAttestationCode,
  InputAttestationCodeAction,
  ReceiveAttestationMessageAction,
  reportRevealStatus,
  ReportRevealStatusAction,
  ResendAttestations,
  setAttestationInputStatus,
  setCompletedCodes,
  setLastRevealAttempt,
  setVerificationStatus,
  startVerification,
  StartVerificationAction,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { getAttestationCodeForSecurityCode } from 'src/identity/securityCode'
import {
  acceptedAttestationCodesSelector,
  attestationCodesSelector,
  attestationInputStatusSelector,
  e164NumberToSaltSelector,
} from 'src/identity/selectors'
import { startAutoSmsRetrieval } from 'src/identity/smsRetrieval'
import { VerificationStatus } from 'src/identity/types'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import {
  actionableAttestationsSelector,
  doVerificationFlow,
  fail,
  KomenciContext,
  komenciContextSelector,
  phoneHashSelector,
  setActionableAttestation,
  setOverrideWithoutVerification,
  shouldUseKomenciSelector,
  start,
  succeed,
  verificationStatusSelector,
} from 'src/verify/reducer'
import { getKomenciKit } from 'src/verify/saga'
import { indexReadyForInput } from 'src/verify/utils'
import { setMtwAddress } from 'src/web3/actions'
import { getContractKit } from 'src/web3/contracts'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'identity/verification'

export const NUM_ATTESTATIONS_REQUIRED = 3
export const VERIFICATION_TIMEOUT = 10 * 60 * 1000 // 10 minutes
export const BALANCE_CHECK_TIMEOUT = 5 * 1000 // 5 seconds
export const MAX_ACTIONABLE_ATTESTATIONS = 5
export const REVEAL_RETRY_DELAY = 10 * 1000 // 10 seconds
export const ANDROID_DELAY_REVEAL_ATTESTATION = 5000 // 5 sec after each

// Using hard-coded gas value to avoid running gas estimation.
// Note: This is fragile and needs be updated if there are significant
// changes to the contract implementation.
const APPROVE_ATTESTATIONS_TX_GAS = 150000
const REQUEST_ATTESTATIONS_TX_GAS = 215000
const SELECT_ISSUERS_TX_GAS = 500000
const COMPLETE_ATTESTATION_TX_GAS = 250000

export enum CodeInputType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  DEEP_LINK = 'deepLink',
}

export interface AttestationCode {
  code: string
  shortCode?: string | null
  issuer: string
}

const inputAttestationCodeLock = new AwaitLock()
const receiveAttestationCodeLock = new AwaitLock()

export function* startVerificationSaga({ withoutRevealing }: StartVerificationAction) {
  const shouldUseKomenci = yield select(shouldUseKomenciSelector)
  ValoraAnalytics.track(VerificationEvents.verification_start, { feeless: shouldUseKomenci })
  Logger.debug(TAG, 'Starting verification')
  const e164Number = yield select(e164NumberSelector)
  yield put(setOverrideWithoutVerification(withoutRevealing))
  yield put(start({ e164Number, withoutRevealing: !!withoutRevealing }))

  const {
    cancel,
    timeout,
    restart,
    success,
    failure,
  }: {
    cancel: CancelVerificationAction
    timeout: true
    restart: ResendAttestations
    success: ReturnType<typeof succeed>
    failure: ReturnType<typeof fail>
  } = yield race({
    cancel: take(Actions.CANCEL_VERIFICATION),
    timeout: delay(VERIFICATION_TIMEOUT),
    restart: take(Actions.RESEND_ATTESTATIONS),
    success: take(succeed.type),
    failure: take(fail.type),
  })

  if (restart) {
    const status: AttestationsStatus = yield select(verificationStatusSelector)
    ValoraAnalytics.track(VerificationEvents.verification_resend_messages, {
      count: status.numAttestationsRemaining,
      feeless: shouldUseKomenci,
    })
    Logger.debug(TAG, 'Verification has been restarted')
    yield put(startVerification(e164Number, false))
  } else if (success) {
    ValoraAnalytics.track(VerificationEvents.verification_complete, { feeless: shouldUseKomenci })
    Logger.debug(TAG, 'Verification completed successfully')
  } else if (failure) {
    ValoraAnalytics.track(VerificationEvents.verification_error, {
      feeless: shouldUseKomenci,
      error: failure.payload,
    })
    Logger.debug(TAG, 'Verification failed')
    yield call(reportActionableAttestationsStatuses)
  } else if (cancel) {
    ValoraAnalytics.track(VerificationEvents.verification_cancel, { feeless: shouldUseKomenci })
    yield put(setVerificationStatus(VerificationStatus.Stopped))
    Logger.debug(TAG, 'Verification cancelled')
    yield call(reportActionableAttestationsStatuses)
  } else if (timeout) {
    ValoraAnalytics.track(VerificationEvents.verification_timeout, { feeless: shouldUseKomenci })
    Logger.debug(TAG, 'Verification timed out')
    yield put(showError(ErrorMessages.VERIFICATION_TIMEOUT))
    yield put(setVerificationStatus(VerificationStatus.Failed))
    yield call(reportActionableAttestationsStatuses)
  }
}

export function* doVerificationFlowSaga(action: ReturnType<typeof doVerificationFlow>) {
  let receiveMessageTask: Task | undefined
  let autoRetrievalTask: Task | undefined
  const withoutRevealing = action.payload
  const shouldUseKomenci: boolean | undefined = yield select(shouldUseKomenciSelector)
  try {
    yield put(setVerificationStatus(VerificationStatus.Prepping))

    const status: AttestationsStatus = yield select(verificationStatusSelector)
    const actionableAttestations: ActionableAttestation[] = yield select(
      actionableAttestationsSelector
    )
    const e164Number: string = yield select(e164NumberSelector)
    const phoneHash: string = yield select(phoneHashSelector)
    const pepperCache = yield select(e164NumberToSaltSelector)
    const pepper = pepperCache[e164Number]
    const phoneHashDetails: PhoneNumberHashDetails = {
      phoneHash,
      pepper,
      e164Number,
    }

    if (!status.isVerified) {
      const komenci: KomenciContext = yield select(komenciContextSelector)
      const { unverifiedMtwAddress } = komenci
      const account: string =
        shouldUseKomenci && unverifiedMtwAddress
          ? unverifiedMtwAddress
          : yield call(getConnectedUnlockedAccount)

      const contractKit = yield call(getContractKit)

      const attestationsWrapper: AttestationsWrapper = yield call([
        contractKit.contracts,
        contractKit.contracts.getAttestations,
      ])

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
          yield put(setVerificationStatus(VerificationStatus.Failed))
          yield put(fail(ErrorMessages.CANT_VERIFY_REVOKED_ACCOUNT))
          return
        }
      }

      // Mark codes completed in previous attempts
      yield put(setCompletedCodes(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining))

      let attestations = actionableAttestations

      if (Platform.OS === 'android' && !isE2EEnv) {
        autoRetrievalTask = yield fork(startAutoSmsRetrieval)
      }

      let issuers = attestations.map((a) => a.issuer)
      // Start listening for manual and/or auto message inputs
      receiveMessageTask = yield takeEvery(
        Actions.RECEIVE_ATTESTATION_MESSAGE,
        attestationCodeReceiver(attestationsWrapper, phoneHashDetails, account, attestations)
      )

      if (!withoutRevealing) {
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_start, {
          feeless: shouldUseKomenci,
        })
        // Request codes for the already existing attestations if any.
        // We check after which ones were successful
        const reveals: boolean[] = yield call(
          revealAttestations,
          attestationsWrapper,
          account,
          phoneHashDetails,
          attestations
        )

        // count how much more attestations we need to request
        const attestationsToRequest =
          status.numAttestationsRemaining - reveals.filter((r: boolean) => r).length

        // check if we hit the limit for max actionable attestations at the same time
        if (attestationsToRequest + attestations.length > MAX_ACTIONABLE_ATTESTATIONS) {
          throw new Error(ErrorMessages.MAX_ACTIONABLE_ATTESTATIONS_EXCEEDED)
        }

        if (attestationsToRequest) {
          yield put(setVerificationStatus(VerificationStatus.RequestingAttestations))
          // request more attestations
          ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_start, {
            attestationsToRequest,
            feeless: shouldUseKomenci,
          })
          attestations = yield call(
            requestAndRetrieveAttestations,
            attestationsWrapper,
            phoneHash,
            account,
            attestations,
            attestations.length + attestationsToRequest,
            shouldUseKomenci
          )
          yield put(setActionableAttestation(attestations))

          ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_complete, {
            issuers,
            feeless: shouldUseKomenci,
          })

          // start listening for the new list of attestations
          receiveMessageTask?.cancel()
          issuers = attestations.map((a) => a.issuer)
          receiveMessageTask = yield takeEvery(
            Actions.RECEIVE_ATTESTATION_MESSAGE,
            attestationCodeReceiver(attestationsWrapper, phoneHashDetails, account, attestations)
          )

          // Request codes for the new list of attestations. We ignore unsuccessfull reveals here,
          // cause we do not want to go into a loop of re-requesting more and more attestations
          yield call(
            revealAttestations,
            attestationsWrapper,
            account,
            phoneHashDetails,
            attestations
          )
        }
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_complete, {
          feeless: shouldUseKomenci,
        })
      }

      yield put(setVerificationStatus(VerificationStatus.CompletingAttestations))
      yield race({
        actionableAttestationCompleted: call(
          completeAttestations,
          attestationsWrapper,
          account,
          phoneHashDetails,
          attestations
        ),
        // This is needed, because we can have more actionableAttestations than NUM_ATTESTATIONS_REQUIRED
        requiredAttestationsCompleted: call(requiredAttestationsCompleted),
      })

      // Set acccount and data encryption key in Accounts contract
      // This is done in other places too, intentionally keeping it for more coverage
      if (!shouldUseKomenci) {
        yield spawn(registerAccountDek)
      }

      receiveMessageTask?.cancel()
      if (Platform.OS === 'android' && !isE2EEnv) {
        autoRetrievalTask?.cancel()
      }

      yield put(setMtwAddress(unverifiedMtwAddress))
    }

    yield put(setVerificationStatus(VerificationStatus.Done))
    yield put(setNumberVerified(true))
    yield put(succeed())
  } catch (error) {
    Logger.error(TAG, 'Error occured during verification flow', error)
    if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
      yield put(setVerificationStatus(VerificationStatus.SaltQuotaExceeded))
    } else if (error.message === ErrorMessages.ODIS_INSUFFICIENT_BALANCE) {
      yield put(setVerificationStatus(VerificationStatus.InsufficientBalance))
    } else {
      yield put(setVerificationStatus(VerificationStatus.Failed))
      yield put(showErrorOrFallback(error, ErrorMessages.VERIFICATION_FAILURE))
    }
    yield put(fail(error.message))
  } finally {
    receiveMessageTask?.cancel()
    if (Platform.OS === 'android' && !isE2EEnv) {
      autoRetrievalTask?.cancel()
    }
  }
}

export function* requiredAttestationsCompleted() {
  while (true) {
    yield take(Actions.COMPLETE_ATTESTATION_CODE)
    const acceptedAttestationCodes: AttestationCode[] = yield select(
      acceptedAttestationCodesSelector
    )
    if (acceptedAttestationCodes.length >= NUM_ATTESTATIONS_REQUIRED) {
      return
    }
  }
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
      requestAttestations,
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

function* requestAttestations(
  attestationsWrapper: AttestationsWrapper,
  numAttestationsRequestsNeeded: number,
  phoneHash: string,
  account: string,
  shouldUseKomenci: boolean
) {
  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  const komenci = yield select(komenciContextSelector)
  const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

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

  let isUnselectedRequestValid = unselectedRequest.blockNumber !== 0
  if (isUnselectedRequestValid) {
    isUnselectedRequestValid = !(yield call(
      [attestationsWrapper, attestationsWrapper.isAttestationExpired],
      unselectedRequest.blockNumber
    ))
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
        `${TAG}@feelessRequestAttestations`,
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
        Logger.debug(TAG, '@feelessRequestAttestations', 'Failed request tx')
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

export function attestationCodeReceiver(
  attestationsWrapper: AttestationsWrapper,
  phoneHashDetails: PhoneNumberHashDetails,
  account: string,
  attestations: ActionableAttestation[],
  isFeelessVerification: boolean = false
) {
  return function* (action: ReceiveAttestationMessageAction) {
    if (!action || !action.message) {
      Logger.warn(TAG + '@attestationCodeReceiver', 'Received empty code. Ignoring.')
      ValoraAnalytics.track(VerificationEvents.verification_code_received, {
        context: 'Empty code',
        feeless: isFeelessVerification,
      })
      return
    }
    Logger.debug(
      TAG + '@attestationCodeReceiver',
      'Received attestation:',
      action.message,
      action.inputType,
      action.index
    )

    // Only one code should be received at the same time so that it doesn't cause any UI glitches by using
    // the same index position for more that one. We use the lock for that.
    yield call([receiveAttestationCodeLock, receiveAttestationCodeLock.acquireAsync])

    let message: string = action.message
    let index: number | null = null
    try {
      const attestationInputStatus: CodeInputStatus[] = yield select(attestationInputStatusSelector)
      index = action.index ?? indexReadyForInput(attestationInputStatus)
      if (index >= NUM_ATTESTATIONS_REQUIRED) {
        Logger.error(
          TAG + '@attestationCodeReceiver',
          'All attestation code positions are full. Ignoring.'
        )
        return
      }
      yield put(setAttestationInputStatus(index, CodeInputStatus.Received))

      const allIssuers = attestations.map((a) => a.issuer)
      let securityCodeWithPrefix: string | null = null

      securityCodeWithPrefix = extractSecurityCodeWithPrefix(message)
      const signer: string = yield call(getConnectedUnlockedAccount)
      if (securityCodeWithPrefix) {
        message = yield call(
          getAttestationCodeForSecurityCode,
          attestationsWrapper,
          phoneHashDetails,
          account,
          attestations,
          securityCodeWithPrefix,
          signer
        )
      } else {
        throw new Error(`No security code in received message: ${message}`)
      }

      const attestationCode = message && extractAttestationCodeFromMessage(message)

      if (!attestationCode) {
        throw new Error('No code extracted from message')
      }
      Logger.debug(TAG + '@attestationCodeReceiver', 'Received attestation code:', attestationCode)

      const existingCode: string = yield call(isCodeAlreadyAccepted, attestationCode)

      if (existingCode) {
        Logger.warn(TAG + '@attestationCodeReceiver', 'Code already exists in store, skipping.')
        ValoraAnalytics.track(VerificationEvents.verification_code_received, {
          context: 'Code already exists',
          feeless: isFeelessVerification,
        })
        if (
          CodeInputType.MANUAL === action.inputType ||
          CodeInputType.DEEP_LINK === action.inputType
        ) {
          yield put(showError(ErrorMessages.REPEAT_ATTESTATION_CODE))
          yield put(setAttestationInputStatus(index, CodeInputStatus.Error))
        }
        return
      }
      ValoraAnalytics.track(VerificationEvents.verification_code_received, {
        feeless: isFeelessVerification,
      })
      const issuer: string | null = yield call(
        [attestationsWrapper, attestationsWrapper.findMatchingIssuer],
        phoneHashDetails.phoneHash,
        account,
        attestationCode,
        allIssuers
      )
      if (!issuer) {
        throw new Error(`No issuer found for attestion code ${message}`)
      }

      Logger.debug(TAG + '@attestationCodeReceiver', `Received code for issuer ${issuer}`)

      ValoraAnalytics.track(VerificationEvents.verification_code_validate_start, {
        issuer,
        feeless: isFeelessVerification,
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
        feeless: isFeelessVerification,
      })

      if (!isValidRequest) {
        throw new Error(`Attestation code (${message}) is not valid (issuer: ${issuer})`)
      }

      Logger.debug(
        TAG + '@attestationCodeReceiver',
        `Attestation code (${message}) is valid, starting processing (issuer: ${issuer})`
      )

      yield put(setAttestationInputStatus(index, CodeInputStatus.Processing))

      yield put(
        inputAttestationCode(
          { code: attestationCode, shortCode: securityCodeWithPrefix, issuer },
          index
        )
      )
    } catch (error) {
      Logger.error(
        TAG + '@attestationCodeReceiver',
        `Error processing attestation code ${message} in index ${index}`,
        error
      )
      yield put(showError(ErrorMessages.INVALID_ATTESTATION_CODE))
      if (index !== null) {
        yield put(setAttestationInputStatus(index, CodeInputStatus.Error))
      }
    } finally {
      receiveAttestationCodeLock.release()
    }
  }
}

function* getCodeForIssuer(issuer: string) {
  const existingCodes: AttestationCode[] = yield select(attestationCodesSelector)
  return existingCodes.find((c) => c.issuer === issuer)
}

function* isCodeAlreadyAccepted(code: string) {
  const existingCodes: AttestationCode[] = yield select(acceptedAttestationCodesSelector)
  return existingCodes.find((c) => c.code === code)
}

export function* revealAttestations(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestations: ActionableAttestation[],
  isFeelessVerification: boolean = false
) {
  Logger.debug(TAG + '@revealAttestations', `Revealing ${attestations.length} attestations`)
  const reveals = []
  for (const attestation of attestations) {
    const success = yield call(
      revealAttestation,
      attestationsWrapper,
      account,
      phoneHashDetails,
      attestation,
      isFeelessVerification
    )
    // TODO (i1skn): remove this clause when
    // https://github.com/celo-org/celo-monorepo/issues/6262 is resolved
    // This sends messages with 5000ms delay on Android if reveals is successful
    if (success && Platform.OS === 'android') {
      Logger.debug(
        TAG + '@revealAttestations',
        `Delaying the next one for: ${ANDROID_DELAY_REVEAL_ATTESTATION}ms`
      )
      yield delay(ANDROID_DELAY_REVEAL_ATTESTATION)
    }
    reveals.push(success)
  }
  yield put(setLastRevealAttempt(Date.now()))
  return reveals
}

export function* completeAttestations(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestations: ActionableAttestation[]
) {
  Logger.debug(
    TAG + '@completeNeededAttestations',
    `Completing ${attestations.length} attestations`
  )
  const contractKit = yield call(getContractKit)
  const komenci = yield select(komenciContextSelector)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

  yield all(
    attestations.map((attestation) => {
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
}

export function* revealAttestation(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation,
  isFeelessVerification: boolean
) {
  const issuer = attestation.issuer
  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_start, {
    issuer,
    feeless: isFeelessVerification,
  })
  return yield call(
    tryRevealPhoneNumber,
    attestationsWrapper,
    account,
    phoneHashDetails,
    attestation,
    isFeelessVerification
  )
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
  Logger.debug(
    TAG,
    '@submitCompleteTxAndRetryOnRevert',
    'Starting to complete attestation',
    code.shortCode
  )
  for (let i = 0; i < numOfRetries; i += 1) {
    Logger.debug(TAG, '@submitCompleteTxAndRetryOnRevert', `try ${i} for ${code.shortCode}`)
    completeTxResult = yield call(
      [komenciKit, komenciKit.completeAttestation],
      mtwAddress,
      phoneHashDetails.phoneHash,
      code.issuer,
      code.code
    )
    Logger.debug(
      TAG,
      '@submitCompleteTxAndRetryOnRevert',
      `result ${i} for ${code.shortCode}`,
      JSON.stringify(completeTxResult)
    )
    if (completeTxResult.ok) {
      return completeTxResult
    }

    // If it's not a revert error, or this is the last retry, then return result
    const errorString = completeTxResult.error.toString().toLowerCase()
    Logger.debug(
      TAG,
      '@submitCompleteTxAndRetryOnRevert',
      `Failed complete tx on retry #${i + 1} - ${code.shortCode} - ${errorString}`
    )
    if (!errorString.includes('revert') || i + 1 === numOfRetries) {
      return completeTxResult
    }

    Logger.debug(TAG, '@submitCompleteTxAndRetryOnRevert', `Failed complete tx on retry #${i + 1}`)
    yield call(waitForNextBlock)
  }
}

function* completeAttestation(
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
  const codePosition = existingCodes.indexOf(code)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_complete, {
    issuer,
    position: codePosition,
    feeless: shouldUseKomenci,
  })

  Logger.debug(
    TAG + '@completeAttestation',
    `Completing code (${code.shortCode} ${codePosition}) for issuer: ${code.issuer}`
  )

  if (shouldUseKomenci) {
    yield call([inputAttestationCodeLock, inputAttestationCodeLock.acquireAsync])
    try {
      Logger.debug(TAG + '@completeAttestation', `Call complete for ${code.shortCode}`)
      const completeTxResult: Result<CeloTxReceipt, FetchError | TxError> = yield call(
        submitCompleteTxAndRetryOnRevert,
        komenciKit,
        account,
        phoneHashDetails,
        code
      )
      Logger.debug(
        TAG + '@completeAttestation',
        `Complete result for ${code.shortCode}`,
        JSON.stringify(completeTxResult)
      )
      if (!completeTxResult.ok) {
        throw completeTxResult.error
      }
    } catch (error) {
      Logger.error(TAG, '@completeAttestation - Failed to complete tx', error)
      throw error
    } finally {
      inputAttestationCodeLock.release()
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
    position: codePosition,
    feeless: shouldUseKomenci,
  })

  // Report reveal status from validator
  yield put(
    reportRevealStatus(
      attestation.attestationServiceURL,
      account,
      issuer,
      phoneHashDetails.e164Number,
      phoneHashDetails.pepper
    )
  )
  Logger.debug(TAG + '@completeAttestation', `Attestation for issuer ${issuer} completed`)
  yield put(completeAttestationCode(code))
}

export function* tryRevealPhoneNumber(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation,
  isFeelessVerification: boolean
) {
  const logPhoneNumberTypeEnabled: boolean = yield select(logPhoneNumberTypeEnabledSelector)
  const issuer = attestation.issuer
  Logger.debug(TAG + '@tryRevealPhoneNumber', `Revealing an attestation for issuer: ${issuer}`)

  try {
    // Only include retriever app sig for android, iOS doesn't support auto-read
    // Skip SMS_RETRIEVER_APP_SIGNATURE for e2e tests
    const smsRetrieverAppSig =
      Platform.OS === 'android' && !isE2EEnv ? SMS_RETRIEVER_APP_SIGNATURE : undefined

    // Proxy required for any network where attestation service domains are not static
    // This works around TLS issues

    const language = yield select(currentLanguageSelector)
    const revealRequest: AttestationRequest = {
      account,
      issuer,
      phoneNumber: phoneHashDetails.e164Number,
      salt: phoneHashDetails.pepper,
      smsRetrieverAppSig,
      language,
      securityCodePrefix: getSecurityCodePrefix(issuer),
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
        account: logPhoneNumberTypeEnabled ? account : undefined,
        phoneNumberType: logPhoneNumberTypeEnabled ? body.phoneNumberType : undefined,
        credentials: logPhoneNumberTypeEnabled ? body.credentials : undefined,
      })

      return true
    }

    if (body.error && body.error.includes('No incomplete attestation found')) {
      // Retry as attestation service might not yet have received the block where it was made responsible for an attestation
      Logger.debug(TAG + '@tryRevealPhoneNumber', `Retrying revealing for issuer: ${issuer}`)

      yield delay(REVEAL_RETRY_DELAY)

      const { ok: retryOk, status: retryStatus, body: retryBody } = yield call(
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
          account: logPhoneNumberTypeEnabled ? account : undefined,
          phoneNumberType: logPhoneNumberTypeEnabled ? retryBody.phoneNumberType : undefined,
          credentials: logPhoneNumberTypeEnabled ? retryBody.credentials : undefined,
        })

        return true
      }

      Logger.error(
        `${TAG}@tryRevealPhoneNumber`,
        `Reveal retry for issuer ${issuer} failed with status ${retryStatus}`
      )
    }

    // Reveal is unsuccessful, so asking the status of it from validator
    yield put(
      reportRevealStatus(
        attestation.attestationServiceURL,
        account,
        issuer,
        phoneHashDetails.e164Number,
        phoneHashDetails.pepper
      )
    )

    throw new Error(`Status code: ${status}. Error: ${body.error}`)
  } catch (error) {
    // This is considered a recoverable error because the user may have received the code in a previous run
    // So instead of propagating the error, we catch it just update status. This will trigger the modal,
    // allowing the user to enter codes manually or skip verification.
    Logger.error(
      TAG + '@tryRevealPhoneNumber',
      `Reveal for issuer ${issuer} with url ${attestation.attestationServiceURL} failed`,
      error
    )
    ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_error, {
      issuer,
      error: error.message,
      feeless: isFeelessVerification,
    })
    return false
  }
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

// Report to analytics reveal status from validator
export function* reportRevealStatusSaga({
  attestationServiceUrl,
  e164Number,
  account,
  issuer,
  pepper,
}: ReportRevealStatusAction) {
  let aggregatedResponse: undefined | { ok: boolean; status: number; body: any }
  const contractKit = yield call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])
  Logger.debug(
    `${TAG}@reportAttestationRevealStatus`,
    `Start for service url ${attestationServiceUrl}`
  )
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
    Logger.error(`${TAG}@reportAttestationRevealStatus`, 'Error calling proxyRevealStatus', error)
    aggregatedResponse = { ok: false, status: 500, body: error }
  }
  if (aggregatedResponse.ok) {
    Logger.debug(
      `${TAG}@reportAttestationRevealStatus`,
      `Successful for service url ${attestationServiceUrl}`
    )
    ValoraAnalytics.track(
      VerificationEvents.verification_reveal_attestation_status,
      aggregatedResponse.body
    )
  } else {
    Logger.debug(
      `${TAG}@reportAttestationRevealStatus`,
      `Failed for service url ${attestationServiceUrl} with Status: ${aggregatedResponse.status}`
    )
  }
}

export function* reportActionableAttestationsStatuses() {
  try {
    const account: string = yield call(getConnectedUnlockedAccount)
    const e164Number: string = yield select(e164NumberSelector)
    const contractKit = yield call(getContractKit)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])
    const phoneHashDetails = yield call(getPhoneHashDetails, e164Number)
    const actionableAttestations: ActionableAttestation[] = yield call(
      getActionableAttestations,
      attestationsWrapper,
      phoneHashDetails.phoneHash,
      account
    )

    for (const attestation of actionableAttestations) {
      yield put(
        reportRevealStatus(
          attestation.attestationServiceURL,
          account,
          attestation.issuer,
          phoneHashDetails.e164Number,
          phoneHashDetails.pepper
        )
      )
    }
  } catch (error) {
    Logger.error(`${TAG}@reportActionableAttestationsStatuses`, 'Can not report', error)
  }
}

// Get the code from the store if it's already there, otherwise wait for it
function* waitForAttestationCode(issuer: string) {
  Logger.debug(TAG + '@waitForAttestationCode', `Waiting for code for issuer ${issuer}`)
  const code = yield call(getCodeForIssuer, issuer)
  if (code) {
    return code
  }

  while (true) {
    const action: InputAttestationCodeAction = yield take(Actions.INPUT_ATTESTATION_CODE)
    if (action.code.issuer === issuer) {
      return action.code
    }
  }
}

function* getPhoneHashDetails(e164Number: string) {
  return yield call(fetchPhoneHashPrivate, e164Number)
}
