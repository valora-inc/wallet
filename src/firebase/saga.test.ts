import firebase from '@react-native-firebase/app'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { initializeAuth, initializeCloudMessaging } from 'src/firebase/firebase'
import { initializeFirebase } from 'src/firebase/saga'
import { getAccount } from 'src/web3/saga'

jest.mock('@react-native-firebase/app', () => ({
  app: () => ({ options: { databaseURL: 'https://test-firebase.example.com' } }),
}))
jest.mock('src/firebase/firebase')

describe('firebase saga', () => {
  it('initializeFirebase', async () => {
    const testAddress = '0x123'
    await expectSaga(initializeFirebase)
      .provide([[call(getAccount), testAddress]])
      .call(initializeAuth, firebase, testAddress)
      .put({ type: 'FIREBASE/AUTHORIZED' })
      .call(initializeCloudMessaging, firebase, testAddress)
      .run()
  })
})
