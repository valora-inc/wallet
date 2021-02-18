import * as reduxSagaTestPlan from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, delay, select } from 'redux-saga/effects'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { KomenciErrorQuotaExceeded } from 'src/identity/feelessVerificationErrors'
import { BALANCE_CHECK_TIMEOUT } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { waitFor } from 'src/redux/sagas-helpers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import {
  e164NumberSelector,
  ensureRealHumanUser,
  fail,
  fetchPhoneNumberDetails,
  isBalanceSufficientForSigRetrievalSelector,
  komenciContextSelector,
  setKomenciAvailable,
  shouldUseKomenciSelector,
  start,
} from 'src/verify/reducer'
import {
  checkIfKomenciAvailableSaga,
  fetchKomenciReadiness,
  fetchKomenciSession,
  getKomenciKit,
  startSaga,
} from 'src/verify/saga'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getAccount, getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'

export const mockAccount = '0x0000000000000000000000000000000000007E57'
export const mockKomenciContext = {
  errorTimestamps: [],
  unverifiedMtwAddress: null,
  sessionActive: false,
  sessionToken: '',
  callbackUrl: undefined,
  captchaToken: '',
}
export const mockE164Number = '+14155550000'

describe(checkIfKomenciAvailableSaga, () => {
  it('sets komenci availability', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(checkIfKomenciAvailableSaga)
      .provide([
        [call(getContractKit), contractKit],
        [call(getAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [call(fetchKomenciReadiness, komenciKit), true],
      ])
      .put(setKomenciAvailable(true))
      .run()
  })
})

describe(startSaga, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('starts with Komenci active session', async () => {
    const withoutRevealing = true
    const contractKit = await getContractKitAsync()
    const activeSessionMockKomenciContext = {
      ...mockKomenciContext,
      sessionActive: true,
    }
    const komenciKit = getKomenciKit(contractKit, mockAccount, activeSessionMockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(startSaga, { payload: withoutRevealing })
      .provide([
        [
          call(navigate, Screens.VerificationLoadingScreen, {
            withoutRevealing,
          }),
          null,
        ],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), true],
        [select(komenciContextSelector), activeSessionMockKomenciContext],
        [
          call(getKomenciKit, contractKit, mockAccount, activeSessionMockKomenciContext),
          komenciKit,
        ],
        [call(fetchKomenciSession, komenciKit, mockE164Number), null],
      ])
      .put(fetchPhoneNumberDetails())
      .run()
  })

  it('starts with Komenci inactive session', async () => {
    const withoutRevealing = true
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(startSaga, { payload: withoutRevealing })
      .provide([
        [
          call(navigate, Screens.VerificationLoadingScreen, {
            withoutRevealing,
          }),
          null,
        ],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), true],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [call(fetchKomenciSession, komenciKit, mockE164Number), null],
      ])
      .put(ensureRealHumanUser())
      .run()
  })

  it('disables Komenci if unrecoverable error has occured', async () => {
    const withoutRevealing = true
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(startSaga, { payload: { withoutRevealing } })
      .provide([
        [
          call(navigate, Screens.VerificationLoadingScreen, {
            withoutRevealing,
          }),
          null,
        ],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), true],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [
          call(fetchKomenciSession, komenciKit, mockE164Number),
          throwError(new KomenciErrorQuotaExceeded()),
        ],
      ])
      .put(setKomenciAvailable(false))
      .put(start({ e164Number: mockE164Number, withoutRevealing }))
      .run()
  })

  it('fails if komenci is disabled and balance fetch timeouts', async () => {
    const withoutRevealing = true
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(startSaga, { payload: withoutRevealing })
      .provide([
        [
          call(navigate, Screens.VerificationLoadingScreen, {
            withoutRevealing,
          }),
          null,
        ],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), false],
        [delay(BALANCE_CHECK_TIMEOUT), true],
      ])
      .put(fail(ErrorMessages.VERIFICATION_FAILURE))
      .run()
  })

  it('fails if komenci is disabled and balance is insufficient', async () => {
    const withoutRevealing = true
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(startSaga, { payload: withoutRevealing })
      .provide([
        [
          call(navigate, Screens.VerificationLoadingScreen, {
            withoutRevealing,
          }),
          null,
        ],
        [call(waitFor, stableTokenBalanceSelector), 1],
        [call(waitFor, celoTokenBalanceSelector), 1],
        [delay(BALANCE_CHECK_TIMEOUT), true],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), false],
        [select(isBalanceSufficientForSigRetrievalSelector), false],
      ])
      .put(fail(ErrorMessages.VERIFICATION_FAILURE))
      .run()
  })

  it('starts with Komenci disabled', async () => {
    const withoutRevealing = true
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(startSaga, { payload: withoutRevealing })
      .provide([
        [
          call(navigate, Screens.VerificationLoadingScreen, {
            withoutRevealing,
          }),
          null,
        ],
        [call(waitFor, stableTokenBalanceSelector), 1],
        [call(waitFor, celoTokenBalanceSelector), 1],
        [delay(BALANCE_CHECK_TIMEOUT), true],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), false],
        [select(isBalanceSufficientForSigRetrievalSelector), true],
      ])
      .put(fetchPhoneNumberDetails())
      .run()
  })
})
