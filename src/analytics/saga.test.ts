import { expectSaga } from 'redux-saga-test-plan'
import { dynamic } from 'redux-saga-test-plan/providers'
import { select } from 'redux-saga/effects'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { updateUserTraits } from 'src/analytics/saga'
import { getCurrentUserTraits } from 'src/analytics/selectors'
import { getSupportedNetworkIds } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

jest.mock('src/statsig')
jest.mocked(getSupportedNetworkIds).mockReturnValue([NetworkId['celo-alfajores']])

describe(updateUserTraits, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('updates the user traits when it changes', async () => {
    const initialTraits = { walletAddress: '0xABC', someUserProp: 'testValue' }

    let callCount = 0
    const traits = () => {
      callCount += 1

      switch (callCount) {
        case 3:
          return { walletAddress: '0xABC', someUserProp: 'changed' }
        case 4:
          return { walletAddress: null, someUserProp: 'changed2' }
        default:
          return initialTraits
      }
    }

    await expectSaga(updateUserTraits)
      .provide([[select(getCurrentUserTraits, [networkConfig.defaultNetworkId]), dynamic(traits)]])
      // dispatch 3 times, so select is called 4 times (see implementation)
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .silentRun()

    expect(AppAnalytics.identify).toHaveBeenCalledTimes(3)
    expect(AppAnalytics.identify).toHaveBeenNthCalledWith(1, '0xABC', {
      walletAddress: '0xABC',
      someUserProp: 'testValue',
    })
    expect(AppAnalytics.identify).toHaveBeenNthCalledWith(2, '0xABC', {
      walletAddress: '0xABC',
      someUserProp: 'changed',
    })
    expect(AppAnalytics.identify).toHaveBeenNthCalledWith(3, null, {
      walletAddress: null,
      someUserProp: 'changed2',
    })
  })
})
