import lib from '@celo/contractkit/lib'
import {
  ActionableAttestation,
  AttestationsWrapper,
  getSecurityCodePrefix,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { Platform } from 'react-native'
import { call, delay, put, select } from 'redux-saga/effects'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

import { AttestationRequest } from '@celo/utils/lib/io'
import { currentLanguageSelector } from 'src/app/reducers'
import { shortVerificationCodesEnabledSelector } from 'src/app/selectors'
import { SMS_RETRIEVER_APP_SIGNATURE } from 'src/config'
import Logger from 'src/utils/Logger'
import { getKomenciAwareAccount } from 'src/verify/komenci'
import {
  actionableAttestationsSelector,
  completeAttestations,
  OnChainVerificationStatus,
  reportRevealStatus,
  requestAttestations,
  REVEAL_RETRY_DELAY,
  RevealStatus,
  RevealStatuses,
  revealStatusesSelector,
  setLastRevealAttempt,
  setRevealStatuses,
  shouldUseKomenciSelector,
  verificationStatusSelector,
} from 'src/verify/module'
import { getActionableAttestations, getPhoneHashDetails } from 'src/verify/saga'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'verify/revealAttestations'
export const ANDROID_DELAY_REVEAL_ATTESTATION = 5000 // 5 sec after each

export function* revealAttestationsSaga() {
  const shouldUseKomenci: boolean = yield select(shouldUseKomenciSelector)
  const account: string = yield call(getKomenciAwareAccount)
  const contractKit: lib.ContractKit = yield call(getContractKit)
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

function* tryRevealPhoneNumber(
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
