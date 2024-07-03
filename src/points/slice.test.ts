import { NetworkId } from 'src/transactions/types'
import reducer, {
  PendingPointsEvent,
  initialState,
  pointsEventProcessed,
  pointsIntroDismissed,
  sendPointsEventStarted,
} from './slice'

const pendingCreateWalletEvent: PendingPointsEvent = {
  id: 'test-id-1',
  timestamp: '2024-04-22T11:00:00.000Z',
  event: { activityId: 'create-wallet' },
}
const pendingSwapEvent: PendingPointsEvent = {
  id: 'test-id-2',
  timestamp: '2024-04-22T12:00:00.000Z',
  event: {
    activityId: 'swap',
    transactionHash: '0xTEST',
    networkId: NetworkId['celo-alfajores'],
    toTokenId: 'mockToTokenId',
    fromTokenId: 'mockFromTokenId',
  },
}

describe('pending points events', () => {
  it('should add pending points events', () => {
    const stateAfterSwapEvent = reducer(
      {
        ...initialState,
        pendingPointsEvents: [],
        trackOnceActivities: {
          'create-wallet': false,
        },
      },
      sendPointsEventStarted(pendingSwapEvent)
    )

    expect(stateAfterSwapEvent.pendingPointsEvents).toEqual([pendingSwapEvent])
    expect(stateAfterSwapEvent.trackOnceActivities).toEqual({
      'create-wallet': false,
    })

    const stateAfterCreateWalletEvent = reducer(
      stateAfterSwapEvent,
      sendPointsEventStarted(pendingCreateWalletEvent)
    )

    expect(stateAfterCreateWalletEvent.pendingPointsEvents).toEqual([
      pendingSwapEvent,
      pendingCreateWalletEvent,
    ])
    expect(stateAfterCreateWalletEvent.trackOnceActivities).toEqual({
      'create-wallet': true,
    })
  })

  it('should remove a pending points event by id', () => {
    const newState = reducer(
      {
        ...initialState,
        pendingPointsEvents: [pendingCreateWalletEvent, pendingSwapEvent],
      },
      pointsEventProcessed(pendingCreateWalletEvent)
    )

    expect(newState.pendingPointsEvents).toEqual([pendingSwapEvent])
  })

  it('should set intro has been seen', () => {
    const newState = reducer(initialState, pointsIntroDismissed())

    expect(newState.introHasBeenDismissed).toEqual(true)
  })
})
