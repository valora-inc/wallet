import { initializeFirebase } from 'src/firebase/saga'
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
