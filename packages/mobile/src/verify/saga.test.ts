import { verifyWallet } from '@celo/komencikit/src/verifyWallet'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import * as reduxSagaTestPlan from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, delay, select } from 'redux-saga/effects'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import {
  setVerificationStatus as setOldVerificationStatus,
  updateE164PhoneNumberSalts,
} from 'src/identity/actions'
import { KomenciErrorQuotaExceeded } from 'src/identity/feelessVerificationErrors'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { e164NumberToSaltSelector } from 'src/identity/reducer'
import { VerificationStatus } from 'src/identity/types'
import { BALANCE_CHECK_TIMEOUT, getActionableAttestations } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { waitFor } from 'src/redux/sagas-helpers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import {
  doVerificationFlow,
  e164NumberSelector,
  ensureRealHumanUser,
  fail,
  fetchMtw,
  fetchOnChainData,
  fetchPhoneNumberDetails,
  isBalanceSufficientForSigRetrievalSelector,
  KomenciAvailable,
  komenciContextSelector,
  overrideWithoutVerificationSelector,
  phoneHashSelector,
  setActionableAttestation,
  setKomenciAvailable,
  setKomenciContext,
  setOverrideWithoutVerification,
  setPhoneHash,
  setVerificationStatus,
  shouldUseKomenciSelector,
  start,
} from 'src/verify/reducer'
import {
  checkIfKomenciAvailableSaga,
  failSaga,
  fetchKomenciReadiness,
  fetchKomenciSession,
  fetchOnChainDataSaga,
  fetchOrDeployMtwSaga,
  fetchPhoneNumberDetailsSaga,
  getKomenciKit,
  resetSaga,
  startSaga,
} from 'src/verify/saga'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { registerWalletAndDekViaKomenci } from 'src/web3/dataEncryptionKey'
import { getAccount, getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'

export const mockAccount = '0x0000000000000000000000000000000000007E57'
export const mockAccount1 = '0x0000000000000000000000000000000000007E58'
export const mockAccount2 = '0x0000000000000000000000000000000000007E59'
export const mockKomenciContext = {
  errorTimestamps: [],
  unverifiedMtwAddress: null,
  sessionActive: false,
  sessionToken: '',
  callbackUrl: undefined,
  captchaToken: '',
}
export const mockE164Number = '+14155550000'
export const mockPepper = 'pepper'
export const mockPhoneHash = getPhoneHash(mockE164Number, mockPepper)

const mockActionableAttestation = {
  issuer: mockAccount2,
  blockNumber: 1,
  attestationServiceURL: 'https://example.com',
  name: 'test validator',
  version: '1.0.0',
}

const mockKomenciKit = {
  getDistributedBlindedPepper: jest.fn(),
  deployWallet: jest.fn(),
}

const mockAttestationsWrapper = {
  lookupAccountsForIdentifier: jest.fn(),
  getVerifiedStatus: jest.fn(),
}

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
      .put(setKomenciAvailable(KomenciAvailable.Yes))
      .run()
  })
})

describe(startSaga, () => {
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
      .put(setKomenciAvailable(KomenciAvailable.No))
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

describe(fetchPhoneNumberDetailsSaga, () => {
  it('succeeds if phoneHash and pepper are cached', async () => {
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(fetchPhoneNumberDetailsSaga)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), true],
        [select(phoneHashSelector), mockPhoneHash],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockPepper }],
      ])
      .put(fetchMtw())
      .run()
  })

  it('succeeds if only pepper is cached', async () => {
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(fetchPhoneNumberDetailsSaga)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), true],
        [select(phoneHashSelector), null],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockPepper }],
      ])
      .put(fetchMtw())
      .put(setPhoneHash(mockPhoneHash))
      .run()
  })

  it('succeeds if pepper is not cached with Komenci', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = mockKomenciKit // getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    ;(komenciKit.getDistributedBlindedPepper as jest.Mock).mockReturnValueOnce({
      ok: true,
      result: { pepper: mockPepper },
    })
    await reduxSagaTestPlan
      .expectSaga(fetchPhoneNumberDetailsSaga)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), true],
        [select(phoneHashSelector), null],
        [select(e164NumberToSaltSelector), {}],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [select(komenciContextSelector), mockKomenciContext],
      ])
      .put(updateE164PhoneNumberSalts({ [mockE164Number]: mockPepper }))
      .put(setPhoneHash(mockPhoneHash))
      .put(fetchMtw())
      .run()
  })

  it('succeeds if pepper is not cached without Komenci', async () => {
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(fetchPhoneNumberDetailsSaga)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), false],
        [select(phoneHashSelector), null],
        [select(e164NumberToSaltSelector), {}],
        [
          call(fetchPhoneHashPrivate, mockE164Number),
          { pepper: mockPepper, phoneHash: mockPhoneHash },
        ],
        [select(komenciContextSelector), mockKomenciContext],
      ])
      .put(updateE164PhoneNumberSalts({ [mockE164Number]: mockPepper }))
      .put(setPhoneHash(mockPhoneHash))
      .put(fetchOnChainData())
      .run()
  })

  it('fails with an error', async () => {
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(fetchPhoneNumberDetailsSaga)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(unlockAccount, mockAccount, true), UnlockResult.SUCCESS],
        [select(e164NumberSelector), mockE164Number],
        [select(shouldUseKomenciSelector), false],
        [select(phoneHashSelector), null],
        [select(e164NumberToSaltSelector), {}],
        [call(fetchPhoneHashPrivate, mockE164Number), throwError(new Error('Test Error'))],
        [select(komenciContextSelector), mockKomenciContext],
      ])
      .put(fail('Test Error'))
      .run()
  })
})

describe(fetchOrDeployMtwSaga, () => {
  it('fails on multiple verified addresses', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue(['0', '1'])
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: true,
    })
    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [select(shouldUseKomenciSelector), false],
        [select(phoneHashSelector), mockPhoneHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [
          call(
            verifyWallet,
            contractKit,
            '0',
            networkConfig.allowedMtwImplementations,
            mockAccount
          ),
          { ok: true },
        ],
        [
          call(
            verifyWallet,
            contractKit,
            '1',
            networkConfig.allowedMtwImplementations,
            mockAccount
          ),
          { ok: true },
        ],
      ])
      .put(
        fail('More than one verified MTW with walletAddress as signer found. Should never happen')
      )
      .run()
  })

  it('succeeds for fresh new account', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue([])
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: true,
    })
    ;(mockKomenciKit.deployWallet as jest.Mock).mockReturnValue({ ok: true, result: mockAccount1 })
    const mockKomenciContextActive = {
      ...mockKomenciContext,
      sessionActive: true,
    }
    const mockVerifyWallet = jest.fn()
    ;(mockVerifyWallet as jest.Mock).mockReturnValueOnce({
      ok: true,
    })
    const mockRegisterWalletAndDekViaKomenci = jest.fn()
    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContextActive],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContextActive), mockKomenciKit],
        [select(phoneHashSelector), mockPhoneHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        {
          call: ({ fn }, next) => (fn === verifyWallet ? mockVerifyWallet() : next()),
        },
        {
          call: ({ fn }, next) =>
            fn === registerWalletAndDekViaKomenci ? mockRegisterWalletAndDekViaKomenci() : next(),
        },
      ])
      .put(setKomenciContext({ unverifiedMtwAddress: mockAccount1 }))
      .put(fetchOnChainData())
      .run()
    expect(mockRegisterWalletAndDekViaKomenci.mock.calls.length).toBe(1)
  })

  it('succeeds for already cached unverified MTW address', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue([
      mockAccount1,
    ])
    const mockKomenciContextWithUnverifiedMtwAddress = {
      ...mockKomenciContext,
      unverifiedMtwAddress: mockAccount1,
      sessionActive: true,
    }
    const mockVerifyWallet = jest.fn()
    ;(mockVerifyWallet as jest.Mock).mockReturnValueOnce({
      ok: false,
    })
    ;(mockVerifyWallet as jest.Mock).mockReturnValueOnce({
      ok: true,
    })
    const mockRegisterWalletAndDekViaKomenci = jest.fn()
    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContextWithUnverifiedMtwAddress],
        [
          call(getKomenciKit, contractKit, mockAccount, mockKomenciContextWithUnverifiedMtwAddress),
          komenciKit,
        ],
        [select(phoneHashSelector), mockPhoneHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        {
          call: ({ fn }, next) => (fn === verifyWallet ? mockVerifyWallet() : next()),
        },
        {
          call: ({ fn }, next) =>
            fn === registerWalletAndDekViaKomenci ? mockRegisterWalletAndDekViaKomenci() : next(),
        },
      ])
      .put(setKomenciContext({ unverifiedMtwAddress: mockAccount1 }))
      .put(fetchOnChainData())
      .run()
    expect(mockRegisterWalletAndDekViaKomenci.mock.calls.length).toBe(1)
  })

  it('succeeds if already deployed wallet is a valid MTW', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue([
      mockAccount1,
    ])
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: true,
    })

    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [select(shouldUseKomenciSelector), false],
        [select(phoneHashSelector), mockPhoneHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [
          call(
            verifyWallet,
            contractKit,
            mockAccount1,
            networkConfig.allowedMtwImplementations,
            mockAccount
          ),
          { ok: true },
        ],
      ])
      .put(
        setKomenciContext({
          unverifiedMtwAddress: mockAccount1,
        })
      )
      .put(
        setVerificationStatus({
          isVerified: true,
        })
      )
      .put(doVerificationFlow(true))
      .run()
  })
})

describe(fetchOnChainDataSaga, () => {
  it('succeeds with Komenci enabled', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: false,
    })
    const mockKomenciContextWithUnverifiedMtwAddress = {
      ...mockKomenciContext,
      unverifiedMtwAddress: mockAccount1,
      sessionActive: true,
    }
    const mockGetActionableAttestations = jest.fn()
    mockGetActionableAttestations.mockReturnValue([mockActionableAttestation])

    await reduxSagaTestPlan
      .expectSaga(fetchOnChainDataSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [select(komenciContextSelector), mockKomenciContextWithUnverifiedMtwAddress],
        [select(overrideWithoutVerificationSelector), true],
        [select(shouldUseKomenciSelector), true],
        [select(phoneHashSelector), mockPhoneHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        {
          call: ({ fn }, next) =>
            fn === getActionableAttestations ? mockGetActionableAttestations() : next(),
        },
      ])
      .put(setActionableAttestation([mockActionableAttestation]))
      .put(setOverrideWithoutVerification(undefined))
      .put(
        setVerificationStatus({
          isVerified: false,
        })
      )
      .put(doVerificationFlow(true))
      .run()
  })

  it('succeeds with Komenci disabled', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: false,
    })
    const mockKomenciContextWithUnverifiedMtwAddress = {
      ...mockKomenciContext,
      unverifiedMtwAddress: mockAccount1,
      sessionActive: true,
    }
    const mockGetActionableAttestations = jest.fn()
    mockGetActionableAttestations.mockReturnValue([mockActionableAttestation])

    await reduxSagaTestPlan
      .expectSaga(fetchOnChainDataSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [select(komenciContextSelector), mockKomenciContextWithUnverifiedMtwAddress],
        [select(overrideWithoutVerificationSelector), true],
        [select(shouldUseKomenciSelector), false],
        [select(phoneHashSelector), mockPhoneHash],
        [call(getAccount), mockAccount],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        {
          call: ({ fn }, next) =>
            fn === getActionableAttestations ? mockGetActionableAttestations() : next(),
        },
      ])
      .put(setActionableAttestation([mockActionableAttestation]))
      .put(setOverrideWithoutVerification(undefined))
      .put(
        setVerificationStatus({
          isVerified: false,
        })
      )
      .put(doVerificationFlow(true))
      .run()
  })
  it('emits fail event if something goes wrong', async () => {
    await reduxSagaTestPlan
      .expectSaga(fetchOnChainDataSaga)
      .provide([[call(getContractKit), throwError(new Error(ErrorMessages.VERIFICATION_FAILURE))]])
      .put(fail(ErrorMessages.VERIFICATION_FAILURE))
      .run()
  })
})

describe(resetSaga, () => {
  it('resets the verification process', async () => {
    await reduxSagaTestPlan
      .expectSaga(resetSaga)
      .provide([[select(e164NumberSelector), mockE164Number]])
      .put(updateE164PhoneNumberSalts({ [mockE164Number]: null }))
      .run()
  })
})

describe(failSaga, () => {
  it('set verification status to failed', async () => {
    await reduxSagaTestPlan
      .expectSaga(failSaga, 'test')
      .put(setOldVerificationStatus(VerificationStatus.Failed))
      .run()
  })
})
