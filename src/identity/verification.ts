import { eqAddress } from '@celo/base'
import { Address } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper,
  getSecurityCodePrefix,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { AttestationRequest } from '@celo/phone-utils'
import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import { retryAsync } from '@celo/utils/lib/async'
import {
  AttestationsStatus,
  extractAttestationCodeFromMessage,
  extractSecurityCodeWithPrefix,
} from '@celo/utils/lib/attestations'
import AwaitLock from 'await-lock'
import { Platform } from 'react-native'
import { call, delay, put, race, select, take } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { logPhoneNumberTypeEnabledSelector } from 'src/app/selectors'
import { CodeInputStatus } from 'src/components/CodeInput'
import { isE2EEnv, SMS_RETRIEVER_APP_SIGNATURE } from 'src/config'
import { currentLanguageSelector } from 'src/i18n/selectors'
import {
  Actions,
  CancelVerificationAction,
  inputAttestationCode,
  ReceiveAttestationMessageAction,
  reportRevealStatus,
  ReportRevealStatusAction,
  ResendAttestations,
  setAttestationInputStatus,
  setLastRevealAttempt,
  setVerificationStatus,
  startVerification,
  StartVerificationAction,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { getAttestationCodeForSecurityCode } from 'src/identity/securityCode'
import {
  acceptedAttestationCodesSelector,
  attestationInputStatusSelector,
} from 'src/identity/selectors'
import { VerificationStatus } from 'src/identity/types'
import Logger from 'src/utils/Logger'
import {
  fail,
  setOverrideWithoutVerification,
  shouldUseKomenciSelector,
  start,
  succeed,
  verificationStatusSelector,
} from 'src/verify/reducer'
import { indexReadyForInput } from 'src/verify/utils'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'identity/verification'

export const NUM_ATTESTATIONS_REQUIRED = 3
export const VERIFICATION_TIMEOUT = 10 * 60 * 1000 // 10 minutes
export const BALANCE_CHECK_TIMEOUT = 5 * 1000 // 5 seconds
export const MAX_ACTIONABLE_ATTESTATIONS = 5
export const REVEAL_RETRY_DELAY = 10 * 1000 // 10 seconds
export const ANDROID_DELAY_REVEAL_ATTESTATION = 5000 // 5 sec after each

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
    ValoraAnalytics.track(VerificationEvents.verification_complete, {
      feeless: shouldUseKomenci,
      phoneNumberHash: getPhoneHash(e164Number),
    })
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
      phoneNumberSignature: undefined,
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

      const {
        ok: retryOk,
        status: retryStatus,
        body: retryBody,
      } = yield call(
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

function* getPhoneHashDetails(e164Number: string) {
  return yield call(fetchPhoneHashPrivate, e164Number)
}
