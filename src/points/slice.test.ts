import { PointsEvent } from 'src/points/types'
import reducer, { initialState, pointsEventProcessed, sendPointsEventStarted } from './slice'

describe('pending points events', () => {
  it('should add a pending points event', () => {
    const id = 'test-id'
    const timestamp = '2024-04-22T11:00:00.000Z'
    const event: PointsEvent = { activityId: 'create-wallet' }
    const pendingPointsEvent = { id, timestamp, event }

    const newState = reducer(
      { ...initialState, pendingPointsEvents: [] },
      sendPointsEventStarted(pendingPointsEvent)
    )

    expect(newState.pendingPointsEvents).toEqual([pendingPointsEvent])
  })

  it('should remove a pending points event by id', () => {
    const id1 = 'test-id-1'
    const id2 = 'test-id-2'
    const timestamp1 = '2024-04-22T11:00:00.000Z'
    const timestamp2 = '2024-04-22T12:00:00.000Z'
    const event1: PointsEvent = { activityId: 'create-wallet' }
    const event2: PointsEvent = { activityId: 'swap', transactionHash: '0xTEST' }
    const pendingPointsEvent1 = { id: id1, timestamp: timestamp1, event: event1 }
    const pendingPointsEvent2 = { id: id2, timestamp: timestamp2, event: event2 }

    const newState = reducer(
      {
        ...initialState,
        pendingPointsEvents: [pendingPointsEvent1, pendingPointsEvent2],
        trackOnceActivities: {
          'create-wallet': false,
        },
      },
      pointsEventProcessed(pendingPointsEvent1)
    )

    expect(newState.pendingPointsEvents).toEqual([pendingPointsEvent2])
    expect(newState.trackOnceActivities).toEqual({
      'create-wallet': true,
    })
  })
})
