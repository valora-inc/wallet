import { PointsEvent } from 'src/points/types'
import reducer, { State, pointsEventProcessed, sendPointsEventStarted } from './slice'

describe('pending points events', () => {
  it('should add a pending points event', () => {
    const id = 'test-id'
    const timestamp = '2024-04-22T11:00:00.000Z'
    const event: PointsEvent = { activityId: 'create-wallet' }
    const pendingPointsEvent = { id, timestamp, event }

    const initialState = { pendingPointsEvents: [] } as unknown as State

    const newState = reducer(initialState, sendPointsEventStarted(pendingPointsEvent))

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

    const initialState = {
      pendingPointsEvents: [pendingPointsEvent1, pendingPointsEvent2],
    } as unknown as State

    const newState = reducer(initialState, pointsEventProcessed({ id: id1 }))

    expect(newState.pendingPointsEvents).toEqual([pendingPointsEvent2])
  })
})
