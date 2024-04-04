import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import * as fetchWithTimeout from 'src/utils/fetchWithTimeout'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { fetchHistory, getHistory, getMoreHistory } from 'src/points/saga'
import { FetchMock } from 'jest-fetch-mock/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { getHistoryError, getHistorySucceeded } from 'src/points/slice'
import { GetHistoryResponse } from 'src/points/types'
import { throwError } from 'redux-saga-test-plan/providers'

jest.mock('src/pincode/authentication')

const MOCK_HISTORY_RESPONSE: GetHistoryResponse = {
  data: [
    {
      activity: 'swap',
      points: '20000000000000000',
      createdAt: '2024-03-05T19:26:25.000Z',
      metadata: {
        to: 'celo-alfajores:native',
        from: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
      },
    },
    {
      activity: 'swap',
      points: '20000000000000000',
      createdAt: '2024-03-04T19:26:25.000Z',
      metadata: {
        to: 'celo-alfajores:0xe4d517785d091d3c54818832db6094bcc2744545',
        from: 'celo-alfajores:native',
      },
    },
  ],
  hasNextPage: true,
  nextPageUrl: 'https://example.com/getHistory?pageSize=2&page=1',
}

describe('fetchHistory', () => {
  const mockFetch = fetch as FetchMock
  const fetchWithTimeoutSpy = jest.spyOn(fetchWithTimeout, 'fetchWithTimeout')

  beforeEach(() => {
    jest.mocked(retrieveSignedMessage).mockResolvedValue('signed-message')
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })
  it('fetches history and returns', async () => {
    mockFetch.mockResponseOnce(JSON.stringify(MOCK_HISTORY_RESPONSE))
    const address = 'some-address'
    const result = await fetchHistory(address)
    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(networkConfig.getPointsHistoryUrl, {
      method: 'GET',
      headers: {
        authorization: `Valora ${address}:signed-message`,
      },
    })
    expect(result).toEqual(MOCK_HISTORY_RESPONSE)
  })
  it('uses custom url if present', async () => {
    mockFetch.mockResponseOnce(JSON.stringify(MOCK_HISTORY_RESPONSE))
    const address = 'some-address'
    const result = await fetchHistory(address, 'https://example.com')
    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith('https://example.com', {
      method: 'GET',
      headers: {
        authorization: `Valora ${address}:signed-message`,
      },
    })
    expect(result).toEqual(MOCK_HISTORY_RESPONSE)
  })
  it('throws on non-200', async () => {
    mockFetch.mockRejectOnce(new Error('failure'))
    const address = 'some-address'
    await expect(fetchHistory(address, 'https://example.com')).rejects.toEqual(new Error('failure'))
  })
})

describe('getHistory', () => {
  it('sets error state if no address found', async () => {
    await expectSaga(getHistory)
      .withState(createMockStore({ web3: { account: null } }).getState())
      .put(getHistoryError())
      .run()
  })
  it('fetches and sets history', async () => {
    await expectSaga(getHistory)
      .withState(createMockStore().getState())
      .provide([[matchers.call.fn(fetchHistory), MOCK_HISTORY_RESPONSE]])
      .put(
        getHistorySucceeded({
          newPointsHistory: MOCK_HISTORY_RESPONSE.data,
          nextPageUrl: MOCK_HISTORY_RESPONSE.nextPageUrl,
        })
      )
      .run()
  })
  it('sets error state if error while fetching', async () => {
    await expectSaga(getHistory)
      .withState(createMockStore().getState())
      .provide([[matchers.call.fn(fetchHistory), throwError(new Error('failure'))]])
      .put(getHistoryError())
      .run()
  })
})

describe('getMoreHistory', () => {
  it('quietly succeeds if no new page is present', async () => {
    await expectSaga(getMoreHistory)
      .withState(createMockStore().getState())
      .put(
        getHistorySucceeded({
          newPointsHistory: [],
          nextPageUrl: null,
        })
      )
      .run()
  })
  it('calls getHistory with next page', async () => {
    const mockUrl = 'https://example.com'
    await expectSaga(getHistory)
      .withState(createMockStore({ points: { nextPageUrl: mockUrl } }).getState())
      .provide([[matchers.call.fn(getHistory), mockUrl]])
      .run()
  })
})
