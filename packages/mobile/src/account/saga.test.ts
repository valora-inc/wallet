import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getWalletAddress } from 'src/web3/saga'
import { fetchFinclusiveKyc } from 'src/account/saga'
import { getFinclusiveComplianceStatus } from 'src/in-house-liquidity'
import { mockAccount } from 'test/values'
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
      .provide([[call(getWalletAddress), mockAccount]])
      .put(setFinclusiveKyc(2))
      .run()
    expect(getFinclusiveComplianceStatus).toHaveBeenCalledTimes(1)
  })
})
