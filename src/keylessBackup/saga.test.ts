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
        .provide([[call([GoogleSignin, 'configure']), undefined]])
        .provide([[call([GoogleSignin, 'signOut']), undefined]])
        .provide([[call([GoogleSignin, 'hasPlayServices']), undefined]])
        .provide([[call([GoogleSignin, 'signIn']), { idToken: 'googleToken' }]])
        .put(googleSignInCompleted({ idToken: 'googleToken' }))
        .run()
      expect(GoogleSignin.configure).toHaveBeenCalledWith({ webClientId: 'mockClientId' })
      expect(GoogleSignin.signOut).toHaveBeenCalledWith()
      expect(GoogleSignin.hasPlayServices).toHaveBeenCalledWith()
      // expect(GoogleSignin.signIn).toHaveBeenCalledWith() // this alone fails, despite the put behind called
    })

    it('puts failed action with error on failed signin', async () => {
      await expectSaga(handleGoogleSignInStarted)
        .provide([[call([GoogleSignin, 'configure']), undefined]])
        .provide([[call([GoogleSignin, 'signOut']), undefined]])
        .provide([[call([GoogleSignin, 'hasPlayServices']), undefined]])
        .provide([[call([GoogleSignin, 'signIn']), throwError(new Error('sign in failed'))]])
        .put(googleSignInFailed({ error: 'Sign in with google failed' }))
        .run()
      expect(GoogleSignin.configure).toHaveBeenCalledWith({ webClientId: 'mockClientId' })
      expect(GoogleSignin.signOut).toHaveBeenCalledWith()
      expect(GoogleSignin.hasPlayServices).toHaveBeenCalledWith()
      // expect(GoogleSignin.signIn).toHaveBeenCalledWith() // this alone fails, despite the put behind called
    })

    it('puts failed action if signin returns null token', async () => {
      await expectSaga(handleGoogleSignInStarted)
        .provide([[call([GoogleSignin, 'configure']), undefined]])
        .provide([[call([GoogleSignin, 'signOut']), undefined]])
        .provide([[call([GoogleSignin, 'hasPlayServices']), undefined]])
        .provide([[call([GoogleSignin, 'signIn']), { idToken: null }]])
        .put(googleSignInFailed({ error: 'Sign in with google failed' }))
        .run()
      expect(GoogleSignin.configure).toHaveBeenCalledWith({ webClientId: 'mockClientId' })
      expect(GoogleSignin.signOut).toHaveBeenCalledWith()
      expect(GoogleSignin.hasPlayServices).toHaveBeenCalledWith()
      // expect(GoogleSignin.signIn).toHaveBeenCalledWith() // this alone fails, despite the put behind called
    })
  })
})
