import { initializeFirebase, waitForAction } from 'src/firebase/saga'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getAccount } from 'src/web3/saga'
import { initializeAuth, initializeCloudMessaging } from 'src/firebase/firebase'
import firebase from '@react-native-firebase/app'

jest.mock('@react-native-firebase/app', () => ({
  app: () => ({ options: { databaseURL: 'https://test-firebase.valoraapp.com' } }),
}))
jest.mock('src/firebase/firebase')
jest.mock('@celo/utils/lib/async')

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
    const testAddress = '0x123'
    await expectSaga(initializeFirebase)
      .provide([[call(getAccount), testAddress]])
      .call(initializeAuth, firebase, testAddress)
      .put({ type: 'FIREBASE/AUTHORIZED' })
      .dispatch({ type: 'HOME/VISIT_HOME' })
      .call(initializeCloudMessaging, firebase, testAddress)
      .run()
  })
})
