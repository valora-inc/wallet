import { expectSaga } from 'redux-saga-test-plan'
import { handleGoogleSignInCompleted } from 'src/keylessBackup/saga'
import { call } from 'redux-saga/effects'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import { googleSignInCompleted, torusKeyshareIssued } from 'src/keylessBackup/slice'

describe('keylessBackup saga', () => {
  it('handleGoogleSignInCompleted', async () => {
    const mockJwt = 'abc.def.ghi'
    await expectSaga(handleGoogleSignInCompleted, googleSignInCompleted({ idToken: mockJwt }))
      .provide([
        [call(getTorusPrivateKey, { verifier: 'valora-auth0', jwt: mockJwt }), 'my-torus-keyshare'],
      ])
      .put(torusKeyshareIssued({ keyshare: 'my-torus-keyshare' }))
      .run()
  })
})
