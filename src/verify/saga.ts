import { Result } from '@celo/base/lib/result'
import { Address, ContractKit } from '@celo/contractkit/lib'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { sleep } from '@celo/utils/lib/async'
import { AttestationsStatus } from '@celo/utils/lib/attestations'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import {
  CheckSessionResp,
  GetDistributedBlindedPepperResp,
  StartSessionResp,
} from '@komenci/kit/lib/actions'
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
} from '@komenci/kit/lib/errors'
import { KomenciKit, ProxyType } from '@komenci/kit/lib/kit'
import { verifyWallet } from '@komenci/kit/lib/verifyWallet'
import DeviceInfo from 'react-native-device-info'
import { all, call, delay, put, race, select, takeEvery, takeLatest } from 'redux-saga/effects'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import {
  setVerificationStatus as setOldVerificationStatus,
  updateE164PhoneNumberSalts,
} from 'src/identity/actions'
import { ReactBlsBlindingClient } from 'src/identity/bls-blinding-client'
import {
  hasExceededKomenciErrorQuota,
  KomenciErrorQuotaExceeded,
  KomenciSessionInvalidError,
  storeTimestampIfKomenciError,
} from 'src/identity/feelessVerificationErrors'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { E164NumberToSaltType } from 'src/identity/reducer'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import { VerificationStatus } from 'src/identity/types'
import {
  doVerificationFlowSaga,
  getActionableAttestations,
  getAttestationsStatus,
} from 'src/identity/verification'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { waitFor } from 'src/redux/sagas-helpers'
import { cUsdBalanceSelector } from 'src/stableToken/selectors'
import Logger from 'src/utils/Logger'
import {
  checkIfKomenciAvailable,
  doVerificationFlow,
  e164NumberSelector,
  ensureRealHumanUser,
  fail,
  fetchMtw,
  fetchOnChainData,
  fetchPhoneNumberDetails,
  isBalanceSufficientForSigRetrievalSelector,
  KomenciAvailable,
  komenciConfigSelector,
  KomenciContext,
  komenciContextSelector,
  overrideWithoutVerificationSelector,
  phoneHashSelector,
  reset,
  setActionableAttestation,
  setKomenciAvailable,
  setKomenciContext,
  setOverrideWithoutVerification,
  setPhoneHash,
  setVerificationStatus,
  shouldUseKomenciSelector,
  start,
  startKomenciSession,
  stop,
  withoutRevealingSelector,
} from 'src/verify/reducer'
import { getContractKit } from 'src/web3/contracts'
import { registerWalletAndDekViaKomenci } from 'src/web3/dataEncryptionKey'
import { getAccount, getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

const TAG = 'verify/saga'
const BALANCE_CHECK_TIMEOUT = 5 * 1000 // 5 seconds
const KOMENCI_READINESS_RETRIES = 3
const KOMENCI_DEPLOY_MTW_RETRIES = 3

function* checkTooManyErrors() {
  const komenci = yield select(komenciContextSelector)
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
  const withoutRevealing = yield select(withoutRevealingSelector)
  // TODO: Move this out of saga
  yield call(navigate, Screens.VerificationLoadingScreen, {
    withoutRevealing,
  })

  Logger.debug(TAG, '@startOrResumeKomenciSession', 'Starting session')
  ValoraAnalytics.track(VerificationEvents.verification_session_started)

  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  const komenci = yield select(komenciContextSelector)
  const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

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

export function* getKomenciKit(
  contractKit: ContractKit,
  walletAddress: Address,
  komenci: KomenciContext
) {
  const komenciConfig = yield select(komenciConfigSelector)
  return new KomenciKit(contractKit, walletAddress, {
    url: komenci.callbackUrl || networkConfig.komenciUrl,
    token: komenci.sessionToken,
    proxyType: komenciConfig.useLightProxy ? ProxyType.LightProxy : ProxyType.LegacyProxy,
    allowedDeployers: komenciConfig.allowedDeployers,
  })
}

export function* checkIfKomenciAvailableSaga() {
  Logger.debug(TAG, '@checkIfKomenciAvailableSaga')
  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getAccount)
  const komenci = yield select(komenciContextSelector)
  const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

  try {
    const isKomenciAvailable: boolean = yield call(fetchKomenciReadiness, komenciKit)
    yield put(setKomenciAvailable(isKomenciAvailable ? KomenciAvailable.Yes : KomenciAvailable.No))
  } catch (error) {
    yield put(setKomenciAvailable(KomenciAvailable.No))
  }
}

export function* startSaga({ payload: { withoutRevealing } }: ReturnType<typeof start>) {
  try {
    const contractKit = yield call(getContractKit)
    const walletAddress = yield call(getConnectedUnlockedAccount)

    Logger.debug(TAG, '@startSaga', walletAddress)

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
          ValoraAnalytics.track(VerificationEvents.verification_recaptcha_started)
          yield put(ensureRealHumanUser())
        } else {
          ValoraAnalytics.track(VerificationEvents.verification_recaptcha_skipped)
          // TODO: Move this out of saga
          yield call(navigate, Screens.VerificationLoadingScreen, {
            withoutRevealing,
          })
          yield put(fetchPhoneNumberDetails())
        }
      } catch (e) {
        Logger.error(TAG, '@startSaga', e)
        storeTimestampIfKomenciError(e)
        if (e instanceof KomenciErrorQuotaExceeded) {
          yield put(setKomenciAvailable(KomenciAvailable.No))
          yield put(start({ e164Number, withoutRevealing }))
        }
      }
    } else {
      const { timeout } = yield race({
        balances: all([
          call(waitFor, cUsdBalanceSelector),
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
    if (error.message === ErrorMessages.PIN_INPUT_CANCELED) {
      // This navigateBack has no effect if part of onboarding and returns to home or
      // settings page if the user pressed on the back button when prompted for the PIN.
      navigateBack()
      return
    } else {
      Logger.error(TAG, '@startSaga', error)
      yield put(fail(`startSaga - ${error}`))
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
      ValoraAnalytics.track(VerificationEvents.verification_hash_cached, {
        phoneHash,
        address: walletAddress,
      })
    } else {
      if (!ownPepper) {
        Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Pepper not cached')
        if (shouldUseKomenci) {
          Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Fetching from Komenci')

          const komenci = yield select(komenciContextSelector)
          const komenciKit = yield call(getKomenciKit, contractKit, walletAddress, komenci)

          // Use DEK for deterministic randomness
          // This allows user to use the same blinded message for the same phone number
          // which prevents consumption of quota for future duplicate requests
          const privateDataKey: string | null = yield select(dataEncryptionKeySelector)
          if (!privateDataKey) {
            throw new Error('No data key in store. Should never happen.')
          }

          const blindingFactor = ReactBlsBlindingClient.generateDeterministicBlindingFactor(
            privateDataKey,
            e164Number
          )

          Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Blinding factor', blindingFactor)
          const blsBlindingClient = new ReactBlsBlindingClient(
            networkConfig.odisPubKey,
            blindingFactor
          )
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
    yield put(fail(`fetchPepper - ${error.message}`))
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
      ValoraAnalytics.track(VerificationEvents.verification_already_completed, {
        mtwAddress: verifiedMtwAddress,
      })
      yield put(doVerificationFlow(true))
      return
    }

    Logger.debug(TAG, '@fetchOrDeployMtwSaga', 'Starting fetch')
    const storedUnverifiedMtwAddress = komenci.unverifiedMtwAddress
    ValoraAnalytics.track(VerificationEvents.verification_mtw_fetch_start, {
      unverifiedMtwAddress: storedUnverifiedMtwAddress,
    })
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
              put(start({ e164Number, withoutRevealing: false }))
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

    ValoraAnalytics.track(VerificationEvents.verification_mtw_fetch_success, {
      mtwAddress: unverifiedMtwAddress,
    })
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
    let account
    ValoraAnalytics.track(VerificationEvents.verification_fetch_on_chain_data_start)
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

    const actionableAttestations: ActionableAttestation[] = yield call(
      getActionableAttestations,
      attestationsWrapper,
      phoneHash,
      account
    )
    Logger.debug(TAG, '@fetchOnChainDataSaga', 'Fetched actionable attestations')
    yield put(setActionableAttestation(actionableAttestations))
    const overrideWithoutVerification = yield select(overrideWithoutVerificationSelector)
    const withoutRevealing =
      overrideWithoutVerification ??
      actionableAttestations.length === status.numAttestationsRemaining

    ValoraAnalytics.track(VerificationEvents.verification_fetch_on_chain_data_success, {
      attestationsRemaining: status.numAttestationsRemaining,
      actionableAttestations: actionableAttestations.length,
    })
    yield put(setOverrideWithoutVerification(undefined))
    yield put(doVerificationFlow(withoutRevealing))
  } catch (error) {
    Logger.error(TAG, '@fetchOnChainDataSaga', error)
    yield put(fail(`fetchOnChainDataSaga - ${error}`))
  }
}

export function* failSaga(action: ReturnType<typeof fail>) {
  Logger.error(TAG, `@failSaga: ${action.payload}`)
  yield put(setOldVerificationStatus(VerificationStatus.Failed))
}

export function* resetSaga() {
  const e164Number = yield select(e164NumberSelector)
  Logger.debug(TAG, `@resetSaga: Reset verification for ${e164Number}`)
  Logger.debug(TAG, `@resetSaga: Reseting pepper`)
  yield put(updateE164PhoneNumberSalts({ [e164Number]: null }))
}

export function* stopSaga() {
  Logger.warn(TAG, `@stopSaga called`)
  // TODO: Move this out of saga
  yield call(navigate, Screens.VerificationEducationScreen, {})
}

export function* verifySaga() {
  Logger.debug(TAG, 'Initializing verify sagas')
  yield takeEvery(checkIfKomenciAvailable.type, checkIfKomenciAvailableSaga)
  yield takeEvery(start.type, startSaga)
  yield takeEvery(startKomenciSession.type, startOrResumeKomenciSessionSaga)
  yield takeEvery(fetchPhoneNumberDetails.type, fetchPhoneNumberDetailsSaga)
  yield takeEvery(fetchMtw.type, fetchOrDeployMtwSaga)
  yield takeEvery(fetchOnChainData.type, fetchOnChainDataSaga)
  yield takeLatest(doVerificationFlow.type, doVerificationFlowSaga)
  yield takeEvery(fail.type, failSaga)
  yield takeEvery(reset.type, resetSaga)
  yield takeEvery(stop.type, stopSaga)
}
