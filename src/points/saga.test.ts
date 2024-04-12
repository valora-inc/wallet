import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { fetchHistory, getHistory, getPointsConfig } from 'src/points/saga'
import {
  getHistoryError,
  getHistoryStarted,
  getHistorySucceeded,
  getPointsConfigError,
  getPointsConfigStarted,
  getPointsConfigSucceeded,
} from 'src/points/slice'
import { GetHistoryResponse } from 'src/points/types'
import * as fetchWithTimeout from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'

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

const mockFetch = fetch as FetchMock
const fetchWithTimeoutSpy = jest.spyOn(fetchWithTimeout, 'fetchWithTimeout')

describe('fetchHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })
  it('fetches history and returns', async () => {
    mockFetch.mockResponseOnce(JSON.stringify(MOCK_HISTORY_RESPONSE))
    const address = 'some-address'
    const result = await fetchHistory(address)
    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(
      networkConfig.getPointsHistoryUrl + '?address=some-address',
      {
        method: 'GET',
      }
    )
    expect(result).toEqual(MOCK_HISTORY_RESPONSE)
  })
  it('uses custom url if present', async () => {
    mockFetch.mockResponseOnce(JSON.stringify(MOCK_HISTORY_RESPONSE))
    const address = 'some-address'
    const result = await fetchHistory(address, 'https://example.com')
    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith('https://example.com', {
      method: 'GET',
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
    const params = getHistoryStarted({
      fromPage: false,
    })
    await expectSaga(getHistory, params)
      .withState(createMockStore({ web3: { account: null } }).getState())
      .put(getHistoryError())
      .run()
  })
  it('fetches and sets history from scratch', async () => {
    const params = getHistoryStarted({
      fromPage: false,
    })
    await expectSaga(getHistory, params)
      .withState(createMockStore().getState())
      .provide([[matchers.call.fn(fetchHistory), MOCK_HISTORY_RESPONSE]])
      .put(
        getHistorySucceeded({
          appendHistory: false,
          newPointsHistory: MOCK_HISTORY_RESPONSE.data,
          nextPageUrl: MOCK_HISTORY_RESPONSE.nextPageUrl,
        })
      )
      .run()
  })
  it('sets error state if error while fetching', async () => {
    const params = getHistoryStarted({
      fromPage: false,
    })
    await expectSaga(getHistory, params)
      .withState(createMockStore().getState())
      .provide([[matchers.call.fn(fetchHistory), throwError(new Error('failure'))]])
      .put(getHistoryError())
      .run()
  })
  it('fetches from stored page if requested', async () => {
    const params = getHistoryStarted({
      fromPage: true,
    })
    await expectSaga(getHistory, params)
      .withState(createMockStore().getState())
      .provide([[matchers.call.fn(fetchHistory), MOCK_HISTORY_RESPONSE]])
      .put(
        getHistorySucceeded({
          appendHistory: true,
          newPointsHistory: MOCK_HISTORY_RESPONSE.data,
          nextPageUrl: MOCK_HISTORY_RESPONSE.nextPageUrl,
        })
      )
      .run()
  })
})

describe('getPointsConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches and sets points config', async () => {
    const config = {
      activitiesById: {
        swap: {
          points: 10,
        },
      },
    }
    mockFetch.mockResponseOnce(JSON.stringify({ config }))

    await expectSaga(getPointsConfig)
      .put(getPointsConfigSucceeded(config))
      .put(getPointsConfigStarted())
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(networkConfig.getPointsConfigUrl, {
      method: 'GET',
    })
  })

  it('only stores supported activities', async () => {
    const config = {
      activitiesById: {
        swap: {
          points: 10,
        },
        'unsupported-activity': {
          points: 10,
        },
      },
    }
    mockFetch.mockResponseOnce(JSON.stringify({ config }))

    await expectSaga(getPointsConfig)
      .put(
        getPointsConfigSucceeded({
          activitiesById: {
            swap: {
              points: 10,
            },
          },
        })
      )
      .put(getPointsConfigStarted())
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(networkConfig.getPointsConfigUrl, {
      method: 'GET',
    })
  })

  it('only stores activities with non zero points value', async () => {
    const config = {
      activitiesById: {
        swap: {
          points: 0,
        },
        'create-wallet': {
          points: 10,
        },
      },
    }
    mockFetch.mockResponseOnce(JSON.stringify({ config }))

    await expectSaga(getPointsConfig)
      .put(
        getPointsConfigSucceeded({
          activitiesById: {
            'create-wallet': {
              points: 10,
            },
          },
        })
      )
      .put(getPointsConfigStarted())
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(networkConfig.getPointsConfigUrl, {
      method: 'GET',
    })
  })

  it('sets error state if error while fetching', async () => {
    mockFetch.mockResponseOnce('Internal Server Error', {
      status: 500,
    })

    await expectSaga(getPointsConfig)
      .put(getPointsConfigStarted())
      .put(getPointsConfigError())
      .not.put(getPointsConfigSucceeded(expect.anything()))
      .run()
  })

  it('sets error state if there are no supported activities', async () => {
    const config = {
      activitiesById: {
        'unsupported-activity': {
          points: 10,
        },
      },
    }
    mockFetch.mockResponseOnce(JSON.stringify({ config }))

    await expectSaga(getPointsConfig)
      .put(getPointsConfigStarted())
      .put(getPointsConfigError())
      .not.put(getPointsConfigSucceeded(expect.anything()))
      .run()
  })
})
