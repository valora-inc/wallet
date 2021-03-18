import { ActionableAttestation } from '@celo/contractkit/lib/wrappers/Attestations'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import * as reduxSagaTestPlan from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, delay, select } from 'redux-saga/effects'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { KomenciErrorQuotaExceeded } from 'src/identity/feelessVerificationErrors'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { e164NumberToSaltSelector } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { waitFor } from 'src/redux/sagas-helpers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { fetchKomenciSession, getKomenciKit } from 'src/verify/komenci'
import {
  AttestationCode,
  BALANCE_CHECK_TIMEOUT,
  e164NumberSelector,
  ensureRealHumanUser,
  fail,
  fetchMtw,
  fetchOnChainData,
  fetchPhoneNumberDetails,
  isBalanceSufficientForSigRetrievalSelector,
  KomenciAvailable,
  komenciContextSelector,
  phoneHashSelector,
  requestAttestations,
  setActionableAttestation,
  setKomenciAvailable,
  setPhoneHash,
  setVerificationStatus,
  shouldUseKomenciSelector,
  start,
} from 'src/verify/module'
import {
  failSaga,
  fetchOnChainDataSaga,
  fetchPhoneNumberDetailsSaga,
  getActionableAttestations,
  resetSaga,
  startSaga,
} from 'src/verify/saga'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getAccount, getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'
import { mockE164NumberPepper, mockPublicDEK } from 'test/values'

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
export const mockPhoneHash = getPhoneHash(mockE164Number, mockE164NumberPepper)
export const mockPhoneHashDetails = {
  e164Number: mockE164Number,
  phoneHash: mockPhoneHash,
  pepper: mockE164NumberPepper,
}

export const MockedAnalytics = ValoraAnalytics as any

export const mockActionableAttestation = {
  issuer: mockAccount2,
  blockNumber: 1,
  attestationServiceURL: 'https://example.com',
  name: 'test validator',
  version: '1.0.0',
}

export const attestationCode0: AttestationCode = {
  code:
    'ab8049b95ac02e989aae8b61fddc10fe9b3ac3c6aebcd3e68be495570b2d3da15aabc691ab88de69648f988fab653ac943f67404e532cfd1013627f56365f36501',
  issuer: '848920b14154b6508b8d98e7ee8159aa84b579a4',
}

export const attestationCode1: AttestationCode = {
  code:
    '2033a9e1268576bf5dfee354a37480529d71f99be82c05005ffb71c7d742d10e7a9aa01f8acc4d7998e1e8b183cf6b8cb4d4a8d923fecfddd191e61e074adc5e00',
  issuer: 'fdb8da92c3597e81c2737e8be793bee9f1172045',
}

export const attestationCode2: AttestationCode = {
  code:
    '1930a9e1268576bf5dfee354a37480529d71f99be82c05005ffb71c7d742d10e7a9aa01f8acc4d7993f75ab183cf6b8cb4d4a8d923fecfddd191e61e074adc5a10',
  issuer: 'ecb8da92c3597e81c2737e8be793bee9f1173156',
}

export const mockActionableAttestations: ActionableAttestation[] = [
  {
    issuer: attestationCode0.issuer,
    blockNumber: 100,
    attestationServiceURL: 'https://fake.celo.org/0',
    name: '',
    version: '1.1.0',
  },
  {
    issuer: attestationCode1.issuer,
    blockNumber: 110,
    attestationServiceURL: 'https://fake.celo.org/1',
    name: '',
    version: '1.1.0',
  },
  {
    issuer: attestationCode2.issuer,
    blockNumber: 120,
    attestationServiceURL: 'https://fake.celo.org/2',
    name: '',
    version: '1.1.0',
  },
]

export const mockKomenciKit = {
  getDistributedBlindedPepper: jest.fn(),
  deployWallet: jest.fn(),
}

export const mockAccountsWrapper = {
  getWalletAddress: jest.fn(() => Promise.resolve(mockAccount)),
  getDataEncryptionKey: jest.fn(() => Promise.resolve(mockPublicDEK)),
}

export const mockAttestationsWrapper = {
  lookupAccountsForIdentifier: jest.fn(),
  getVerifiedStatus: jest.fn(),
  getRevealStatus: jest.fn(),
  getActionableAttestations: jest.fn(),
}

describe(startSaga, () => {
  it('starts with Komenci active session', async () => {
    const contractKit = await getContractKitAsync()
    const activeSessionMockKomenciContext = {
      ...mockKomenciContext,
      sessionActive: true,
    }
    const komenciKit = getKomenciKit(contractKit, mockAccount, activeSessionMockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(startSaga)
      .provide([
        [call(navigate, Screens.VerificationLoadingScreen), null],
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
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(startSaga)
      .provide([
        [call(navigate, Screens.VerificationLoadingScreen), null],
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
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(startSaga)
      .provide([
        [call(navigate, Screens.VerificationLoadingScreen), null],
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
      .put(start({ e164Number: mockE164Number }))
      .run()
  })

  it('fails if komenci is disabled and balance fetch timeouts', async () => {
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(startSaga)
      .provide([
        [call(navigate, Screens.VerificationLoadingScreen), null],
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
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(startSaga)
      .provide([
        [call(navigate, Screens.VerificationLoadingScreen), null],
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
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(startSaga)
      .provide([
        [call(navigate, Screens.VerificationLoadingScreen), null],
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
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
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
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
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
      result: { pepper: mockE164NumberPepper },
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
      .put(updateE164PhoneNumberSalts({ [mockE164Number]: mockE164NumberPepper }))
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
          { pepper: mockE164NumberPepper, phoneHash: mockPhoneHash },
        ],
        [select(komenciContextSelector), mockKomenciContext],
      ])
      .put(updateE164PhoneNumberSalts({ [mockE164Number]: mockE164NumberPepper }))
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
      .put(
        setVerificationStatus({
          isVerified: false,
        })
      )
      .put(requestAttestations())
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
      .put(
        setVerificationStatus({
          isVerified: false,
        })
      )
      .put(requestAttestations())
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
      .provide([[select(shouldUseKomenciSelector), true]])
      .run()
  })
})
