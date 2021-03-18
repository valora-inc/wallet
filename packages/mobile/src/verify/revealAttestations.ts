import lib from '@celo/contractkit/lib'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { Platform } from 'react-native'
import { call, delay, put, select } from 'redux-saga/effects'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

import Logger from 'src/utils/Logger'
import { getKomenciAwareAccount, getPhoneHashDetails } from 'src/verify/komenci'
import {
  actionableAttestationsSelector,
  completeAttestations,
  OnChainVerificationStatus,
  reportRevealStatus,
  requestAttestations,
  RevealStatus,
  RevealStatuses,
  revealStatusesSelector,
  setLastRevealAttempt,
  setRevealStatuses,
  shouldUseKomenciSelector,
  verificationStatusSelector,
} from 'src/verify/module'
import { tryRevealPhoneNumber } from 'src/verify/requestAttestations'
import { getActionableAttestations } from 'src/verify/saga'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'verify/revealAttestations'
const ANDROID_DELAY_REVEAL_ATTESTATION = 5000 // 5 sec after each

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
