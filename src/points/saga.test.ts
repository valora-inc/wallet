import { combineReducers } from '@reduxjs/toolkit'
import { addDays } from 'date-fns'
import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select, spawn } from 'redux-saga/effects'
import { Actions as AppActions } from 'src/app/actions'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import * as pointsSaga from 'src/points/saga'
import {
  fetchHistory,
  fetchTrackPointsEventsEndpoint,
  getHistory,
  getPointsBalance,
  getPointsConfig,
  sendPendingPointsEvents,
  sendPointsEvent,
  watchAppMounted,
} from 'src/points/saga'
import { pendingPointsEventsSelector, trackOnceActivitiesSelector } from 'src/points/selectors'
import pointsReducer, {
  PendingPointsEvent,
  getHistoryError,
  getHistoryStarted,
  getHistorySucceeded,
  getPointsBalanceError,
  getPointsBalanceStarted,
  getPointsBalanceSucceeded,
  getPointsConfigError,
  getPointsConfigStarted,
  getPointsConfigSucceeded,
  pointsEventProcessed,
  sendPointsEventStarted,
  trackPointsEvent,
} from 'src/points/slice'
import { ClaimHistory, GetHistoryResponse, PointsEvent } from 'src/points/types'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import * as fetchWithTimeout from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'
import { getWalletAddress } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'
import { v4 as uuidv4 } from 'uuid'

jest.mock('src/statsig')

jest.mock('uuid')
jest.mock('src/utils/Logger')
jest.unmock('src/pincode/authentication')

const MOCK_HISTORY_RESPONSE: GetHistoryResponse = {
  data: [
    {
      activityId: 'swap',
      pointsAmount: 20,
      createdAt: '2024-03-05T19:26:25.000Z',
      metadata: {
        to: 'celo-alfajores:native',
        from: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
      },
    },
    {
      activityId: 'swap',
      pointsAmount: 20,
      createdAt: '2024-03-04T19:26:25.000Z',
      metadata: {
        to: 'celo-alfajores:0xe4d517785d091d3c54818832db6094bcc2744545',
        from: 'celo-alfajores:native',
      },
    },
    {
      activityId: 'fake-activity' as any,
      pointsAmount: 20,

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

// We'll only store history entries in Redux if they have known values for activityId
const MOCK_SUPPORTED_HISTORY = MOCK_HISTORY_RESPONSE.data.slice(0, 2)

const MOCK_POINTS_HISTORY: ClaimHistory[] = [
  { activityId: 'create-wallet', pointsAmount: 10, createdAt: 'some time' },
]

const mockFetch = fetch as FetchMock
const fetchWithTimeoutSpy = jest.spyOn(fetchWithTimeout, 'fetchWithTimeout')

const mockTime = '2024-04-20T12:00:00.000Z'
const mockId = 'test-id'
const mockServerSuccessResponse = { ok: true }
const mockServerErrorMessage = 'Error message from server'
const mockServerErrorResponse = {
  ok: false,
  status: 500,
  statusText: 'Internal Server Error',
  text: jest.fn(() => Promise.resolve(mockServerErrorMessage)),
}

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
      networkConfig.getPointsHistoryUrl + '?address=some-address&pageSize=10',
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
          getNextPage: false,
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
          newPointsHistory: MOCK_SUPPORTED_HISTORY,
          nextPageUrl: MOCK_HISTORY_RESPONSE.nextPageUrl,
        })
      )
      .run()

    expect(storeState.points.pointsHistory).toEqual(MOCK_SUPPORTED_HISTORY)
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
          getNextPage: false,
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
          newPointsHistory: MOCK_SUPPORTED_HISTORY,
          nextPageUrl: MOCK_HISTORY_RESPONSE.nextPageUrl,
        })
      )
      .run()

    expect(storeState.points.pointsHistory).toEqual([
      ...MOCK_POINTS_HISTORY,
      ...MOCK_SUPPORTED_HISTORY,
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
})

describe('getPointsBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch and store the balance on first history fetch', async () => {
    const mockBalance = '100'
    mockFetch.mockResponseOnce(JSON.stringify({ balance: mockBalance }))

    await expectSaga(getPointsBalance, getHistoryStarted({ getNextPage: false }))
      .withState(createMockStore().getState())
      .put(getPointsBalanceStarted())
      .put(getPointsBalanceSucceeded(mockBalance))
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(
      `${networkConfig.getPointsBalanceUrl}?address=${mockAccount.toLowerCase()}`,
      {
        method: 'GET',
      }
    )
  })

  it('should not fetch the balance on next history fetch', async () => {
    await expectSaga(getPointsBalance, getHistoryStarted({ getNextPage: true }))
      .not.put(getPointsBalanceStarted())
      .not.put(getPointsBalanceSucceeded(expect.anything()))
      .not.put(getPointsBalanceError())
      .run()

    expect(fetchWithTimeoutSpy).not.toHaveBeenCalled()
  })

  it('should store an error on failed balance fetch', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'something went wrong' }), { status: 500 })

    await expectSaga(getPointsBalance, getHistoryStarted({ getNextPage: false }))
      .withState(createMockStore().getState())
      .put(getPointsBalanceStarted())
      .not.put(getPointsBalanceSucceeded(expect.anything()))
      .put(getPointsBalanceError())
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(
      `${networkConfig.getPointsBalanceUrl}?address=${mockAccount.toLowerCase()}`,
      {
        method: 'GET',
      }
    )
  })
})

describe('sendPointsEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: new Date(mockTime).getTime() })
    jest.mocked(uuidv4).mockReturnValue(mockId)
  })

  it('should add and remove pending points event in case of successful fetch', () => {
    const mockAction = trackPointsEvent({ activityId: 'create-wallet' })

    return expectSaga(sendPointsEvent, mockAction)
      .provide([
        [matchers.call.fn(pointsSaga.fetchTrackPointsEventsEndpoint), mockServerSuccessResponse],
        [select(trackOnceActivitiesSelector), { 'create-wallet': false }],
        [select(pendingPointsEventsSelector), []],
      ])
      .put(
        sendPointsEventStarted({
          id: mockId,
          timestamp: mockTime,
          event: mockAction.payload,
        })
      )
      .put(pointsEventProcessed({ id: mockId }))
      .run()
  })

  it('should add and not remove pending points event in case of server error', async () => {
    const mockAction = trackPointsEvent({ activityId: 'create-wallet' })

    await expectSaga(sendPointsEvent, mockAction)
      .provide([
        [matchers.call.fn(pointsSaga.fetchTrackPointsEventsEndpoint), mockServerErrorResponse],
        [select(trackOnceActivitiesSelector), { 'create-wallet': false }],
        [select(pendingPointsEventsSelector), []],
      ])
      .put(
        sendPointsEventStarted({
          id: mockId,
          timestamp: mockTime,
          event: mockAction.payload,
        })
      )
      .not.put(pointsEventProcessed({ id: mockId }))
      .run()

    expect(Logger.warn).toHaveBeenCalledWith(
      'Points/saga@sendPointsEvent',
      mockAction.payload.activityId,
      mockServerErrorResponse.status,
      mockServerErrorResponse.statusText,
      mockServerErrorMessage
    )
  })

  it('should ignore any track once activities that were already tracked', async () => {
    const mockAction = trackPointsEvent({ activityId: 'create-wallet' })

    return expectSaga(sendPointsEvent, mockAction)
      .provide([
        [select(trackOnceActivitiesSelector), { 'create-wallet': true }],
        [select(pendingPointsEventsSelector), []],
      ])
      .not.put(sendPointsEventStarted(expect.anything()))
      .not.call(fetchTrackPointsEventsEndpoint)
      .not.put(pointsEventProcessed(expect.anything()))
      .run()
  })

  it('should ignore any activities that are currently being tracked', async () => {
    const mockSwapEvent = {
      activityId: 'swap' as const,
      transactionHash: '0x1234',
      networkId: NetworkId['celo-mainnet'],
      toTokenId: 'toTokenId',
      fromTokenId: 'fromTokenId',
    }
    const mockAction = trackPointsEvent(mockSwapEvent)

    return expectSaga(sendPointsEvent, mockAction)
      .provide([
        [select(trackOnceActivitiesSelector), { 'create-wallet': true }],
        [
          select(pendingPointsEventsSelector),
          [{ id: 'someId', timestamp: 1234, event: mockSwapEvent }],
        ],
      ])
      .not.put(sendPointsEventStarted(expect.anything()))
      .not.call(fetchTrackPointsEventsEndpoint)
      .not.put(pointsEventProcessed(expect.anything()))
      .run()
  })
})

describe('sendPendingPointsEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: new Date(mockTime).getTime() })
  })

  it('should remove pending points event after successful fetch', () => {
    const mockPendingPointsEvent: PendingPointsEvent = {
      id: mockId,
      timestamp: mockTime,
      event: { activityId: 'create-wallet' },
    }

    return expectSaga(sendPendingPointsEvents)
      .withState(
        createMockStore({ points: { pendingPointsEvents: [mockPendingPointsEvent] } }).getState()
      )
      .provide([
        [matchers.call.fn(pointsSaga.fetchTrackPointsEventsEndpoint), mockServerSuccessResponse],
      ])
      .call(fetchTrackPointsEventsEndpoint, mockPendingPointsEvent.event)
      .put(pointsEventProcessed({ id: mockId }))
      .run()
  })

  it('should remove expired pending points event', async () => {
    const mockExpiredPendingPointsEvent: PendingPointsEvent = {
      id: mockId,
      timestamp: addDays(new Date(mockTime), -31).toISOString(),
      event: { activityId: 'create-wallet' },
    }

    await expectSaga(sendPendingPointsEvents)
      .withState(
        createMockStore({
          points: { pendingPointsEvents: [mockExpiredPendingPointsEvent] },
        }).getState()
      )
      .put(pointsEventProcessed({ id: mockId }))
      .not.call(fetchTrackPointsEventsEndpoint, mockExpiredPendingPointsEvent.event)
      .run()

    expect(Logger.debug).toHaveBeenCalledWith(
      'Points/saga@sendPendingPointsEvents/expiredEvent',
      mockExpiredPendingPointsEvent
    )
  })

  it('should not remove pending points event in case of server error', async () => {
    const mockPendingPointsEvent: PendingPointsEvent = {
      id: mockId,
      timestamp: mockTime,
      event: { activityId: 'create-wallet' },
    }

    await expectSaga(sendPendingPointsEvents)
      .withState(
        createMockStore({
          points: { pendingPointsEvents: [mockPendingPointsEvent] },
        }).getState()
      )
      .provide([
        [matchers.call.fn(pointsSaga.fetchTrackPointsEventsEndpoint), mockServerErrorResponse],
      ])
      .not.put(pointsEventProcessed({ id: mockId }))
      .run()

    expect(Logger.warn).toHaveBeenCalledWith(
      'Points/saga@sendPendingPointsEvents',
      mockPendingPointsEvent.event.activityId,
      mockServerErrorResponse.status,
      mockServerErrorResponse.statusText,
      mockServerErrorMessage
    )
  })

  it('should not remove pending points event in case of exception', async () => {
    const mockPendingPointsEvent: PendingPointsEvent = {
      id: mockId,
      timestamp: mockTime,
      event: { activityId: 'create-wallet' },
    }
    const mockError = new Error('Test error')

    await expectSaga(sendPendingPointsEvents)
      .withState(
        createMockStore({
          points: { pendingPointsEvents: [mockPendingPointsEvent] },
        }).getState()
      )
      .provide([
        [matchers.call.fn(pointsSaga.fetchTrackPointsEventsEndpoint), throwError(mockError)],
      ])
      .not.put(pointsEventProcessed({ id: mockId }))
      .run()

    expect(Logger.warn).toHaveBeenCalledWith('Points/saga@sendPendingPointsEvents', mockError)
  })
})

describe('watchAppMounted', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should spawn all sagas only once even if multiple "app mounted" actions are dispatched', async () => {
    const mockAction = { type: AppActions.APP_MOUNTED }

    const result = await expectSaga(watchAppMounted)
      .provide([
        [call(getWalletAddress), mockAccount],
        [spawn(getPointsConfig), null],
        [spawn(getPointsBalance, getHistoryStarted({ getNextPage: false })), null],
        [spawn(sendPendingPointsEvents), null],
      ])
      .dispatch(mockAction)
      .dispatch(mockAction)
      .run()

    expect(result.effects.fork).toEqual([
      spawn(getPointsConfig),
      spawn(getPointsBalance, getHistoryStarted({ getNextPage: false })),
      spawn(sendPendingPointsEvents),
    ])
  })
})

describe('fetchTrackPointsEventsEndpoint', () => {
  it('should call fetch with correct params', async () => {
    const mockEvent: PointsEvent = { activityId: 'create-wallet' }
    mockFetch.mockResponseOnce(JSON.stringify({ ok: true }))

    await expectSaga(fetchTrackPointsEventsEndpoint, mockEvent)
      .provide([
        [select(walletAddressSelector), mockAccount],
        [call(retrieveSignedMessage), 'someSignedMessage'],
      ])
      .run()

    expect(fetchWithTimeoutSpy).toHaveBeenCalledWith(networkConfig.trackPointsEventUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora ${mockAccount}:someSignedMessage`,
      },
      body: JSON.stringify(mockEvent),
    })
  })
})
