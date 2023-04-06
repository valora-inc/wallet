import { initializeFirebase, waitForAction } from 'src/firebase/saga'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select, take } from 'redux-saga/effects'
import { getAccount } from 'src/web3/saga'
import { initializeAuth, initializeCloudMessaging } from 'src/firebase/firebase'
import { walletAddressSelector } from 'src/web3/selectors'
import { mocked } from 'ts-jest/utils'
import firebase from '@react-native-firebase/app'

jest.mock('@react-native-firebase/app', () => ({
  app: () => ({ options: { databaseURL: 'https://test-firebase.valoraapp.com' } }),
}))
jest.mock('src/firebase/firebase')
jest.mock('@celo/utils/lib/async')
jest.mock('src/web3/selectors')

describe('firebase saga', () => {
  it('waitForAction', async () => {
    const testEffect = jest.fn()
    const testAction = 'TestAction'
    const testSaga = function* () {
      yield waitForAction(testAction as any)
      yield call(testEffect)
    }

    // calls testEffect after action is dispatched
    await expectSaga(testSaga).dispatch({ type: testAction }).call(testEffect).run()

    // calls testEffect without waiting for action after the first time
    await expectSaga(testSaga).call(testEffect).run()
  })
  it('initializeFirebase', async () => {
    mocked(walletAddressSelector).mockReturnValue('0x123')
    await expectSaga(initializeFirebase)
      // .call(getAccount)
      // .call(initializeAuth)
      // .put({ type: 'FIREBASE/AUTHORIZED' })
      .provide([
        // [select(walletAddressSelector), '0x123'],  // trying out jest mock instead
        [take('HOME/VISIT_HOME'), 'HOME/VISIT_HOME'],
      ])
      // .not.call(initializeCloudMessaging)
      // .dispatch({ type: 'HOME/VISIT_HOME' })
      // .provide([[take('HOME/VISIT_HOME'), 'HOME/VISIT_HOME']])
      .call(initializeCloudMessaging, firebase, '0x123')
      .run()
  })
})
