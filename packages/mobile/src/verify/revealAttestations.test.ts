import * as reduxSagaTestPlan from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { e164NumberSelector, reportRevealStatus } from 'src/verify/module'
import {
  reportActionableAttestationsStatuses,
  reportRevealStatusSaga,
} from 'src/verify/revealAttestations'
import { getPhoneHashDetails } from 'src/verify/saga'
import { getContractKitAsync } from 'src/web3/contracts'
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
}

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
