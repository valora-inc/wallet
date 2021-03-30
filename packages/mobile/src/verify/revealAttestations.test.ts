import * as reduxSagaTestPlan from 'redux-saga-test-plan'
import { call, delay, select } from 'redux-saga/effects'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { currentLanguageSelector } from 'src/app/reducers'
import { shortVerificationCodesEnabledSelector } from 'src/app/selectors'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { getKomenciAwareAccount } from 'src/verify/komenci'
import {
  actionableAttestationsSelector,
  completeAttestations,
  e164NumberSelector,
  reportRevealStatus,
  requestAttestations,
  RevealStatus,
  revealStatusesSelector,
  setLastRevealAttempt,
  setRevealStatuses,
  shouldUseKomenciSelector,
  verificationStatusSelector,
} from 'src/verify/module'
import {
  ANDROID_DELAY_REVEAL_ATTESTATION,
  reportActionableAttestationsStatuses,
  reportRevealStatusSaga,
  revealAttestationsSaga,
} from 'src/verify/revealAttestations'
import { getPhoneHashDetails } from 'src/verify/saga'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import {
  mockAccount,
  mockActionableAttestations,
  mockE164Number,
  mockE164NumberHash,
  mockE164NumberPepper,
  mockPhoneHashDetails,
  mockPublicDEK,
} from 'test/values'

const mockAccountsWrapper = {
  getWalletAddress: jest.fn(() => Promise.resolve(mockAccount)),
  getDataEncryptionKey: jest.fn(() => Promise.resolve(mockPublicDEK)),
}
const MockedAnalytics = ValoraAnalytics as any

const mockAttestationsWrapper = {
  lookupAccountsForIdentifier: jest.fn(),
  getVerifiedStatus: jest.fn(),
  getRevealStatus: jest.fn(),
  getActionableAttestations: jest.fn(),
  revealPhoneNumberToIssuer: jest.fn(),
}

describe(revealAttestationsSaga, () => {
  const dateNowStub = jest.fn(() => 1588200517518)
  global.Date.now = dateNowStub

  beforeEach(() => {
    MockedAnalytics.track.mockReset()
  })

  it('reveals attestations and proceed to complete stage', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.revealPhoneNumberToIssuer as jest.Mock).mockReturnValue({
      ok: true,
      json: () => ({}),
    })

    const mockGetRevealStatuses = jest.fn(() => ({
      [mockActionableAttestations[0].issuer]: RevealStatus.Revealed,
      [mockActionableAttestations[1].issuer]: RevealStatus.Revealed,
      [mockActionableAttestations[2].issuer]: RevealStatus.Revealed,
    }))
    mockGetRevealStatuses.mockReturnValueOnce({})

    await reduxSagaTestPlan
      .expectSaga(revealAttestationsSaga)
      .provide([
        {
          select: ({ selector }, next) => {
            if (selector === shouldUseKomenciSelector) {
              return true
            }
            if (selector === shortVerificationCodesEnabledSelector) {
              return false
            }
            if (selector === actionableAttestationsSelector) {
              return mockActionableAttestations
            }
            if (selector === verificationStatusSelector) {
              return { numAttestationsRemaining: 2 }
            }
            if (selector === revealStatusesSelector) {
              return mockGetRevealStatuses()
            }
            if (selector === currentLanguageSelector) {
              return 'en'
            }
            return next()
          },
        },
        [delay(ANDROID_DELAY_REVEAL_ATTESTATION), true],
        [call(getContractKit), contractKit],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call(getKomenciAwareAccount), mockAccount],
        [call(getPhoneHashDetails), mockPhoneHashDetails],
      ])
      .put(setRevealStatuses({ [mockActionableAttestations[0].issuer]: RevealStatus.Revealed }))
      .put(setRevealStatuses({ [mockActionableAttestations[1].issuer]: RevealStatus.Revealed }))
      .put(setRevealStatuses({ [mockActionableAttestations[2].issuer]: RevealStatus.Revealed }))
      .put(setLastRevealAttempt(Date.now()))
      .put(completeAttestations())
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(6)
    expect(MockedAnalytics.track.mock.calls[0][0]).toStrictEqual(
      VerificationEvents.verification_reveal_attestation_start
    )
    expect(MockedAnalytics.track.mock.calls[1][0]).toStrictEqual(
      VerificationEvents.verification_reveal_attestation_revealed
    )
    expect(MockedAnalytics.track.mock.calls[2][0]).toStrictEqual(
      VerificationEvents.verification_reveal_attestation_start
    )
    expect(MockedAnalytics.track.mock.calls[3][0]).toStrictEqual(
      VerificationEvents.verification_reveal_attestation_revealed
    )
    expect(MockedAnalytics.track.mock.calls[4][0]).toStrictEqual(
      VerificationEvents.verification_reveal_attestation_start
    )
    expect(MockedAnalytics.track.mock.calls[5][0]).toStrictEqual(
      VerificationEvents.verification_reveal_attestation_revealed
    )
  })

  it('reveals attestations and proceed to requesting more stage', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.revealPhoneNumberToIssuer as jest.Mock).mockReturnValue({
      ok: true,
      json: () => ({}),
    })

    const mockGetRevealStatuses = jest.fn(() => ({}))

    await reduxSagaTestPlan
      .expectSaga(revealAttestationsSaga)
      .provide([
        {
          select: ({ selector }, next) => {
            if (selector === shouldUseKomenciSelector) {
              return true
            }
            if (selector === shortVerificationCodesEnabledSelector) {
              return false
            }
            if (selector === actionableAttestationsSelector) {
              return mockActionableAttestations
            }
            if (selector === verificationStatusSelector) {
              return { numAttestationsRemaining: 2 }
            }
            if (selector === revealStatusesSelector) {
              return mockGetRevealStatuses()
            }
            if (selector === currentLanguageSelector) {
              return 'en'
            }
            return next()
          },
        },
        [delay(ANDROID_DELAY_REVEAL_ATTESTATION), true],
        [call(getContractKit), contractKit],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call(getKomenciAwareAccount), mockAccount],
        [call(getPhoneHashDetails), mockPhoneHashDetails],
      ])
      .put(setRevealStatuses({ [mockActionableAttestations[0].issuer]: RevealStatus.Revealed }))
      .put(setRevealStatuses({ [mockActionableAttestations[1].issuer]: RevealStatus.Revealed }))
      .put(setRevealStatuses({ [mockActionableAttestations[2].issuer]: RevealStatus.Revealed }))
      .put(setLastRevealAttempt(Date.now()))
      .put(requestAttestations())
      .run()
  })
})

describe(reportRevealStatusSaga, () => {
  beforeEach(() => {
    MockedAnalytics.track.mockReset()
  })
  it('report actionable attestation to analytics', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.getRevealStatus as jest.Mock).mockReturnValue({
      ok: true,
      json: () => body,
    })

    const mockIssuer = mockActionableAttestations[0].issuer
    const body = { issuer: mockIssuer, custom: 'payload' }
    await reduxSagaTestPlan
      .expectSaga(reportRevealStatusSaga, {
        payload: {
          attestationServiceUrl: 'url',
          e164Number: mockE164Number,
          account: mockAccount,
          issuer: mockIssuer,
          pepper: mockE164NumberPepper,
        },
      })
      .provide([
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
      ])
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(1)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(
      VerificationEvents.verification_reveal_attestation_status
    )
    expect(MockedAnalytics.track.mock.calls[0][1]).toStrictEqual(body)
  })
})

describe(reportActionableAttestationsStatuses, () => {
  it('report actionable attestations', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.getActionableAttestations as jest.Mock).mockReturnValue(
      mockActionableAttestations
    )

    await reduxSagaTestPlan
      .expectSaga(reportActionableAttestationsStatuses)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(getPhoneHashDetails), mockPhoneHashDetails],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [
          call(fetchPhoneHashPrivate, mockE164Number),
          {
            phoneHash: mockE164NumberHash,
            e164Number: mockE164Number,
            pepper: mockE164NumberPepper,
          },
        ],
      ])
      .put(
        reportRevealStatus({
          attestationServiceUrl: mockActionableAttestations[0].attestationServiceURL,
          account: mockAccount,
          issuer: mockActionableAttestations[0].issuer,
          e164Number: mockE164Number,
          pepper: mockE164NumberPepper,
        })
      )
      .put(
        reportRevealStatus({
          attestationServiceUrl: mockActionableAttestations[1].attestationServiceURL,
          account: mockAccount,
          issuer: mockActionableAttestations[1].issuer,
          e164Number: mockE164Number,
          pepper: mockE164NumberPepper,
        })
      )
      .put(
        reportRevealStatus({
          attestationServiceUrl: mockActionableAttestations[2].attestationServiceURL,
          account: mockAccount,
          issuer: mockActionableAttestations[2].issuer,
          e164Number: mockE164Number,
          pepper: mockE164NumberPepper,
        })
      )
      .run()
  })
})
