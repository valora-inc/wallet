import { expectSaga } from 'redux-saga-test-plan'
import { dynamic } from 'redux-saga-test-plan/providers'
import { select } from 'redux-saga/effects'
import { getCurrentUserTraits, updateUserTraits } from 'src/analytics/saga'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

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
      .provide([[select(getCurrentUserTraits), dynamic(traits)]])
      // dispatch 3 times, so select is called 4 times (see implementation)
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .silentRun()

    expect(ValoraAnalytics.setUserAddress).toHaveBeenCalledTimes(3)
    expect(ValoraAnalytics.setUserAddress).toHaveBeenNthCalledWith(1, '0xABC')
    expect(ValoraAnalytics.setUserAddress).toHaveBeenNthCalledWith(2, '0xABC')
    expect(ValoraAnalytics.setUserAddress).toHaveBeenNthCalledWith(3, null)

    // Note: identify is not called when the wallet address is null, unlike setUserAddress
    expect(ValoraAnalytics.identify).toHaveBeenCalledTimes(2)
    expect(ValoraAnalytics.identify).toHaveBeenNthCalledWith(1, '0xABC', {
      walletAddress: '0xABC',
      someUserProp: 'testValue',
    })
    expect(ValoraAnalytics.identify).toHaveBeenNthCalledWith(2, '0xABC', {
      walletAddress: '0xABC',
      someUserProp: 'changed',
    })
  })
})
