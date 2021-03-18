import { Result } from '@celo/base/lib/result'
import { Address, ContractKit } from '@celo/contractkit/lib'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { GetDistributedBlindedPepperResp } from '@celo/komencikit/src/actions'
import { FetchError, TxError } from '@celo/komencikit/src/errors'
import { KomenciKit } from '@celo/komencikit/src/kit'
import { eqAddress } from '@celo/utils/lib/address'
import { retryAsync } from '@celo/utils/lib/async'
import {
  AttestationsStatus,
  extractAttestationCodeFromMessage,
  extractSecurityCodeWithPrefix,
} from '@celo/utils/lib/attestations'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
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
  KomenciErrorQuotaExceeded,
  storeTimestampIfKomenciError,
} from 'src/identity/feelessVerificationErrors'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { e164NumberToSaltSelector } from 'src/identity/reducer'

import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import AwaitLock from 'await-lock'
import { setNumberVerified } from 'src/app/actions'
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
import {
  checkIfKomenciAvailableSaga,
  fetchKomenciSession,
  fetchOrDeployMtwSaga,
  getKomenciAwareAccount,
  getKomenciKit,
  getPhoneHashDetails,
  startOrResumeKomenciSessionSaga,
} from 'src/verify/komenci'
import {
  actionableAttestationsSelector,
  AttestationCode,
  attestationCodesSelector,
  BALANCE_CHECK_TIMEOUT,
  cancel,
  checkIfKomenciAvailable,
  CodeInputType,
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
  komenciContextSelector,
  NUM_ATTESTATIONS_REQUIRED,
  phoneHashSelector,
  receiveAttestationCode,
  reportRevealStatus,
  requestAttestations,
  resendMessages,
  reset,
  revealAttestations,
  RevealStatus,
  revealStatusesSelector,
  revoke,
  setActionableAttestation,
  setCompletedCodes,
  setKomenciAvailable,
  setPhoneHash,
  setRevealStatuses,
  setVerificationStatus,
  shouldUseKomenciSelector,
  start,
  startKomenciSession,
  stop,
  succeed,
  VERIFICATION_TIMEOUT,
  verificationStatusSelector,
} from 'src/verify/module'
import { requestAttestationsSaga } from 'src/verify/requestAttestations'
import {
  reportActionableAttestationsStatuses,
  reportRevealStatusSaga,
  revealAttestationsSaga,
} from 'src/verify/revealAttestations'
import { getContractKit } from 'src/web3/contracts'
import { getAccount, getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'

const TAG = 'verify/saga'
const inputAttestationCodeLock = new AwaitLock()

// Using hard-coded gas value to avoid running gas estimation.
// Note: This is fragile and needs be updated if there are significant
// changes to the contract implementation.
export const APPROVE_ATTESTATIONS_TX_GAS = 150000
export const REQUEST_ATTESTATIONS_TX_GAS = 215000
export const SELECT_ISSUERS_TX_GAS = 500000
export const COMPLETE_ATTESTATION_TX_GAS = 250000
export const MINIMUM_VERSION_FOR_SHORT_CODES = '1.1.0'

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
export function* submitCompleteTxAndRetryOnRevert(
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
