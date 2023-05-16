import { expectSaga } from 'redux-saga-test-plan'
import { handleGoogleSignInStarted } from 'src/keylessBackup/saga'
import { googleSignInCompleted } from 'src/keylessBackup/slice'

describe('KeylessBackup saga', () => {
  describe('handleGoogleSignInStarted', () => {
    it('completes with dummy token', async () => {
      await expectSaga(handleGoogleSignInStarted)
        .put(googleSignInCompleted({ idToken: 'dummy' }))
        .run()
    })
  })
})
