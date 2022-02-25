import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { getMTWAddress } from 'src/web3/saga'
import { fetchFinclusiveKyc } from 'src/account/saga'
import { finclusiveKycStatusSelector, kycStatusSelector } from 'src/account/selectors'
import { FinclusiveKycStatus, KycStatus } from './reducer'
import { getFinclusiveComplianceStatus } from 'src/in-house-liquidity'
import { mockAccount, mockDEKAddress } from 'test/values'
import { dataEncryptionKeySelector } from 'src/web3/selectors'
import { setFinclusiveKyc } from './actions'

jest.useRealTimers()

jest.mock('src/in-house-liquidity', () => ({
  ...(jest.requireActual('src/in-house-liquidity') as any),
  getFinclusiveComplianceStatus: jest.fn(() => Promise.resolve(2)),
}))

describe('fetchFinclusiveKyc', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })
  test('calls finclusive if persona is accepted but finclusive kyc is not', async () => {
    await expectSaga(fetchFinclusiveKyc)
      .provide([
        [select(kycStatusSelector), KycStatus.Approved],
        [select(finclusiveKycStatusSelector), FinclusiveKycStatus.InReview],
        [call(getMTWAddress), mockAccount],
        [select(dataEncryptionKeySelector), mockDEKAddress],
      ])
      .put(setFinclusiveKyc(2))
      .run()
    expect(getFinclusiveComplianceStatus).toHaveBeenCalledTimes(1)
  })
  test('does not call fincluisve if Persona KYC is not yet approved', async () => {
    await expectSaga(fetchFinclusiveKyc)
      .provide([
        [select(kycStatusSelector), KycStatus.Pending],
        [select(finclusiveKycStatusSelector), FinclusiveKycStatus.NotSubmitted],
        [call(getMTWAddress), mockAccount],
        [select(dataEncryptionKeySelector), mockDEKAddress],
      ])
      .run()
    expect(getFinclusiveComplianceStatus).toHaveBeenCalledTimes(0)
  })
  test('does not call fincluisve if Finclusive KYC has been accepted', async () => {
    await expectSaga(fetchFinclusiveKyc)
      .provide([
        [select(kycStatusSelector), KycStatus.Approved],
        [select(finclusiveKycStatusSelector), FinclusiveKycStatus.Accepted],
        [call(getMTWAddress), mockAccount],
        [select(dataEncryptionKeySelector), mockDEKAddress],
      ])
      .run()
    expect(getFinclusiveComplianceStatus).toHaveBeenCalledTimes(0)
  })
})
