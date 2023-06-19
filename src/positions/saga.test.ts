import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'typed-redux-saga'
import { fetchPositionsSaga } from 'src/positions/saga'
import {
  fetchPositionsFailure,
  fetchPositionsStart,
  fetchPositionsSuccess,
} from 'src/positions/slice'
import { getFeatureGate } from 'src/statsig'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockPositions } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/sentry/SentryTransactionHub')
jest.mock('src/statsig')

const MOCK_RESPONSE = {
  message: 'OK',
  data: mockPositions,
}

const mockFetch = fetch as FetchMock

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.resetMocks()
})

describe(fetchPositionsSaga, () => {
  it('fetches positions successfully', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE))
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .put(fetchPositionsStart())
      .put(fetchPositionsSuccess(MOCK_RESPONSE.data))
      .run()
  })

  it("skips fetching positions if the feature gate isn't enabled", async () => {
    mocked(getFeatureGate).mockReturnValue(false)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips fetching positions if no address is available in the store', async () => {
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), null]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("dispatches an error if there's an error", async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .put(fetchPositionsStart())
      .put.actionType(fetchPositionsFailure.type)
      .run()
  })
})
