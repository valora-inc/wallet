import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { getMTWAddress } from 'src/web3/saga'
import { fetchFinclusiveKyc } from 'src/account/saga'
import { getFinclusiveComplianceStatus } from 'src/in-house-liquidity'
import { mockAccount, mockDEKAddress } from 'test/values'
import { dataEncryptionKeySelector } from 'src/web3/selectors'
import { setFinclusiveKyc } from './actions'

jest.mock('src/in-house-liquidity', () => ({
  ...(jest.requireActual('src/in-house-liquidity') as any),
  getFinclusiveComplianceStatus: jest.fn(() => Promise.resolve(2)),
}))

describe('fetchFinclusiveKyc', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })
  test('calls finclusive if persona is approved but finclusive kyc is not', async () => {
    await expectSaga(fetchFinclusiveKyc)
      .provide([
        [call(getMTWAddress), mockAccount],
        [select(dataEncryptionKeySelector), mockDEKAddress],
      ])
      .put(setFinclusiveKyc(2))
      .run()
    expect(getFinclusiveComplianceStatus).toHaveBeenCalledTimes(1)
  })
})
