import { combineReducers } from '@reduxjs/toolkit'
import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { fetchHistory, getHistory, getPointsConfig } from 'src/points/saga'
import pointsReducer, {
  getHistoryError,
  getHistoryStarted,
  getHistorySucceeded,
  getPointsConfigError,
  getPointsConfigStarted,
  getPointsConfigSucceeded,
} from 'src/points/slice'
import { ClaimHistory, GetHistoryResponse } from 'src/points/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import * as fetchWithTimeout from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

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

const MOCK_POINTS_HISTORY: ClaimHistory[] = [
  { activity: 'create-wallet', points: '10', createdAt: 'some time' },
]

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
    mockFetch.mockResponseOnce('failure', { status: 400 })
    const address = 'some-address'
    await expect(fetchHistory(address, 'https://example.com')).rejects.toEqual(new Error('failure'))
  })
})

describe('getHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets error state if no address found', async () => {
    const params = getHistoryStarted({
      getNextPage: false,
    })
    await expectSaga(getHistory, params)
      .withState(createMockStore({ web3: { account: null } }).getState())
      .put(
        getHistoryError({
          resetHistory: true,
        })
      )
      .run()
  })

  it('fetches and sets history from scratch', async () => {
    const params = getHistoryStarted({
      getNextPage: false,
    })
    const mockStore = createMockStore({ points: { pointsHistory: MOCK_POINTS_HISTORY } })
    const { storeState } = await expectSaga(getHistory, params)
      .withReducer(combineReducers({ points: pointsReducer }), mockStore.getState())
      .provide([[matchers.call.fn(fetchHistory), MOCK_HISTORY_RESPONSE]])
      .put(
        getHistorySucceeded({
          appendHistory: false,
          newPointsHistory: MOCK_HISTORY_RESPONSE.data,
          nextPageUrl: MOCK_HISTORY_RESPONSE.nextPageUrl,
        })
      )
      .run()

    expect(storeState.points.pointsHistory).toEqual(MOCK_HISTORY_RESPONSE.data)
  })
  it('sets error state if error while fetching', async () => {
    const params = getHistoryStarted({
      getNextPage: false,
    })
    await expectSaga(getHistory, params)
      .withState(createMockStore().getState())
      .provide([[matchers.call.fn(fetchHistory), throwError(new Error('failure'))]])
      .put(
        getHistoryError({
          resetHistory: true,
        })
      )
      .run()
  })
  it('fetches from stored page if requested', async () => {
    const params = getHistoryStarted({
      getNextPage: true,
    })
    const mockStore = createMockStore({
      points: { pointsHistory: MOCK_POINTS_HISTORY, nextPageUrl: 'foo' },
    })
    const { storeState } = await expectSaga(getHistory, params)
      .withReducer(combineReducers({ points: pointsReducer }), mockStore.getState())
      .provide([[matchers.call.fn(fetchHistory), MOCK_HISTORY_RESPONSE]])
      .put(
        getHistorySucceeded({
          appendHistory: true,
          newPointsHistory: MOCK_HISTORY_RESPONSE.data,
          nextPageUrl: MOCK_HISTORY_RESPONSE.nextPageUrl,
        })
      )
      .run()

    expect(storeState.points.pointsHistory).toEqual([
      ...MOCK_POINTS_HISTORY,
      ...MOCK_HISTORY_RESPONSE.data,
    ])
  })

  it('skips fetching is new page is requested but none stored in redux', async () => {
    const params = getHistoryStarted({
      getNextPage: true,
    })
    const mockStore = createMockStore({ points: { pointsHistory: MOCK_POINTS_HISTORY } })
    const { storeState } = await expectSaga(getHistory, params)
      .withReducer(combineReducers({ points: pointsReducer }), mockStore.getState())
      .put(
        getHistorySucceeded({
          appendHistory: true,
          newPointsHistory: [],
          nextPageUrl: null,
        })
      )
      .run()

    expect(storeState.points.pointsHistory).toEqual(MOCK_POINTS_HISTORY)
  })
})

describe('getPointsConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_POINTS)
  })

  it('fetches and sets points config', async () => {
    const config = {
      activitiesById: {
        swap: {
          pointsAmount: 10,
        },
      },
    }
    mockFetch.mockResponseOnce(JSON.stringify({ config }))

    await expectSaga(getPointsConfig)
      .put(getPointsConfigStarted())
      .put(getPointsConfigSucceeded(config))
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(networkConfig.getPointsConfigUrl, {
      method: 'GET',
    })
  })

  it('only stores supported activities', async () => {
    const config = {
      activitiesById: {
        swap: {
          pointsAmount: 10,
        },
        'unsupported-activity': {
          pointsAmount: 10,
        },
      },
    }
    mockFetch.mockResponseOnce(JSON.stringify({ config }))

    await expectSaga(getPointsConfig)
      .put(
        getPointsConfigSucceeded({
          activitiesById: {
            swap: {
              pointsAmount: 10,
            },
          },
        })
      )
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(networkConfig.getPointsConfigUrl, {
      method: 'GET',
    })
  })

  it('only stores activities with non zero points value', async () => {
    const config = {
      activitiesById: {
        swap: {
          pointsAmount: 0,
        },
        'create-wallet': {
          pointsAmount: 10,
        },
      },
    }
    mockFetch.mockResponseOnce(JSON.stringify({ config }))

    await expectSaga(getPointsConfig)
      .put(
        getPointsConfigSucceeded({
          activitiesById: {
            'create-wallet': {
              pointsAmount: 10,
            },
          },
        })
      )
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
      .put(getPointsConfigError())
      .not.put(getPointsConfigSucceeded(expect.anything()))
      .run()
  })

  it('does not fetch if points are not enabled', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)

    await expectSaga(getPointsConfig)
      .not.put(getPointsConfigStarted())
      .not.put(getPointsConfigSucceeded(expect.anything()))
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
