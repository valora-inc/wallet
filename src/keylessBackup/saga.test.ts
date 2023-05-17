import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { handleGoogleSignInStarted } from 'src/keylessBackup/saga'
import { googleSignInCompleted, googleSignInFailed } from 'src/keylessBackup/slice'

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signOut: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}))

jest.mock('src/config', () => ({
  GOOGLE_OAUTH_CLIENT_ID: 'mockClientId',
}))

describe('KeylessBackup saga', () => {
  describe('handleGoogleSignInStarted', () => {
    it('puts completed action with idToken on successful signin', async () => {
      await expectSaga(handleGoogleSignInStarted)
        .provide([
          [call([GoogleSignin, 'signOut']), undefined],
          [call([GoogleSignin, 'hasPlayServices']), undefined],
          [call([GoogleSignin, 'signIn']), { idToken: 'googleToken' }],
        ])
        .call([GoogleSignin, 'signOut'])
        .call([GoogleSignin, 'hasPlayServices'])
        .call([GoogleSignin, 'signIn'])
        .put(googleSignInCompleted({ idToken: 'googleToken' }))
        .run()
      expect(GoogleSignin.configure).toHaveBeenCalledWith({ webClientId: 'mockClientId' })
    })

    it('puts failed action with error on failed signin', async () => {
      await expectSaga(handleGoogleSignInStarted)
        .provide([
          [call([GoogleSignin, 'signOut']), undefined],
          [call([GoogleSignin, 'hasPlayServices']), undefined],
          [call([GoogleSignin, 'signIn']), throwError(new Error('sign in failed'))],
        ])
        .call([GoogleSignin, 'signOut'])
        .call([GoogleSignin, 'hasPlayServices'])
        .call([GoogleSignin, 'signIn'])
        .put(googleSignInFailed())
        .run()
      expect(GoogleSignin.configure).toHaveBeenCalledWith({ webClientId: 'mockClientId' })
    })

    it('puts failed action if signin returns null token', async () => {
      await expectSaga(handleGoogleSignInStarted)
        .provide([
          [call([GoogleSignin, 'signOut']), undefined],
          [call([GoogleSignin, 'hasPlayServices']), undefined],
          [call([GoogleSignin, 'signIn']), null],
        ])
        .call([GoogleSignin, 'signOut'])
        .call([GoogleSignin, 'hasPlayServices'])
        .call([GoogleSignin, 'signIn'])
        .put(googleSignInFailed())
        .run()
      expect(GoogleSignin.configure).toHaveBeenCalledWith({ webClientId: 'mockClientId' })
    })
  })
})
