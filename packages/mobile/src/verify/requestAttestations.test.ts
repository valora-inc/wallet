import * as reduxSagaTestPlan from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { shortVerificationCodesEnabledSelector } from 'src/app/selectors'
import { getKomenciAwareAccount, getKomenciKit } from 'src/verify/komenci'
import {
  actionableAttestationsSelector,
  fail,
  komenciContextSelector,
  phoneHashSelector,
  revealAttestations,
  RevealStatus,
  revealStatusesSelector,
  setActionableAttestation,
  shouldUseKomenciSelector,
  verificationStatusSelector,
} from 'src/verify/module'
import { requestAttestationsSaga } from 'src/verify/requestAttestations'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import {
  mockAccount,
  mockActionableAttestations,
  mockE164NumberHash,
  mockKomenciContext,
} from 'test/values'

const mockAttestationsWrapper = {
  getUnselectedRequest: jest.fn(),
  isAttestationExpired: jest.fn(),
  approveAttestationFee: jest.fn(),
  request: jest.fn(),
  waitForSelectingIssuers: jest.fn(),
  selectIssuers: jest.fn(),
  getActionableAttestations: jest.fn(),
}

const MockedAnalytics = ValoraAnalytics as any

describe(requestAttestationsSaga, () => {
  beforeEach(() => {
    MockedAnalytics.track.mockReset()
  })

  it('fails if phoneHash is undefined', async () => {
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(requestAttestationsSaga)
      .provide([
        [select(shouldUseKomenciSelector), true],
        [call(getContractKit), contractKit],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call(getKomenciAwareAccount), mockAccount],
        [select(phoneHashSelector), undefined],
      ])
      .put(fail('Phone Hash is undefined at requestAttestationsSaga'))
      .run()
  })

  it('passes onto revealAttestations if no more attestations needed', async () => {
    const contractKit = await getContractKitAsync()
    await reduxSagaTestPlan
      .expectSaga(requestAttestationsSaga)
      .provide([
        [select(shouldUseKomenciSelector), true],
        [call(getContractKit), contractKit],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call(getKomenciAwareAccount), mockAccount],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(actionableAttestationsSelector), mockActionableAttestations],
        [select(verificationStatusSelector), { numAttestationsRemaining: 3 }],
        [select(revealStatusesSelector), {}],
      ])
      .put(revealAttestations())
      .run()

    await reduxSagaTestPlan
      .expectSaga(requestAttestationsSaga)
      .provide([
        [select(shouldUseKomenciSelector), true],
        [call(getContractKit), contractKit],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call(getKomenciAwareAccount), mockAccount],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(actionableAttestationsSelector), mockActionableAttestations],
        [select(verificationStatusSelector), { numAttestationsRemaining: 2 }],
        [
          select(revealStatusesSelector),
          { [mockActionableAttestations[0].issuer]: RevealStatus.Failed },
        ],
      ])
      .put(revealAttestations())
      .run()
  })

  it('request more attestations with Komenci enabled', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    const finalActionableAttestations = [
      ...mockActionableAttestations,
      mockActionableAttestations[0],
    ]
    ;(mockAttestationsWrapper.getUnselectedRequest as jest.Mock).mockReturnValue({
      blockNumber: 0,
    })
    ;(mockAttestationsWrapper.waitForSelectingIssuers as jest.Mock).mockReturnValue(null)
    ;(mockAttestationsWrapper.getActionableAttestations as jest.Mock).mockReturnValue(
      finalActionableAttestations
    )

    await reduxSagaTestPlan
      .expectSaga(requestAttestationsSaga)
      .provide([
        [select(shouldUseKomenciSelector), true],
        [call(getContractKit), contractKit],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContext],
        [
          call([komenciKit, komenciKit.requestAttestations], mockAccount, mockE164NumberHash, 1),
          { ok: true },
        ],
        [
          call([komenciKit, komenciKit.selectIssuers], mockAccount, mockE164NumberHash),
          { ok: true },
        ],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [call(getKomenciAwareAccount), mockAccount],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(actionableAttestationsSelector), mockActionableAttestations],
        [select(verificationStatusSelector), { numAttestationsRemaining: 3 }],
        [select(shortVerificationCodesEnabledSelector), false],
        [
          select(revealStatusesSelector),
          {
            [mockActionableAttestations[0].issuer]: RevealStatus.Failed,
          },
        ],
      ])
      .put(setActionableAttestation(finalActionableAttestations))
      .run()
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(
      VerificationEvents.verification_request_all_attestations_start
    )
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(
      VerificationEvents.verification_request_attestation_start
    )
    expect(MockedAnalytics.track.mock.calls[2][0]).toBe(
      VerificationEvents.verification_request_attestation_approve_tx_sent
    )
    expect(MockedAnalytics.track.mock.calls[3][0]).toBe(
      VerificationEvents.verification_request_attestation_request_tx_sent
    )
    expect(MockedAnalytics.track.mock.calls[4][0]).toBe(
      VerificationEvents.verification_request_attestation_await_issuer_selection
    )
    expect(MockedAnalytics.track.mock.calls[5][0]).toBe(
      VerificationEvents.verification_request_attestation_select_issuer
    )
    expect(MockedAnalytics.track.mock.calls[6][0]).toBe(
      VerificationEvents.verification_request_attestation_issuer_tx_sent
    )
    expect(MockedAnalytics.track.mock.calls[7][0]).toBe(
      VerificationEvents.verification_request_attestation_complete
    )
    expect(MockedAnalytics.track.mock.calls[8][0]).toBe(
      VerificationEvents.verification_request_all_attestations_complete
    )
  })
})
