import { expectSaga } from 'redux-saga-test-plan'
import { handleGoogleSignInCompleted } from 'src/keylessBackup/saga'
import { call } from 'redux-saga/effects'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import {
  googleSignInCompleted,
  keylessBackupFailed,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { throwError } from 'redux-saga-test-plan/providers'

describe('keylessBackup saga', () => {
  const mockJwt = 'abc.def.ghi'
  it('handleGoogleSignInCompleted: success case', async () => {
    const mockTorusKeyshare = 'my-torus-keyshare'
    await expectSaga(handleGoogleSignInCompleted, googleSignInCompleted({ idToken: mockJwt }))
      .provide([
        [call(getTorusPrivateKey, { verifier: 'valora-auth0', jwt: mockJwt }), mockTorusKeyshare],
      ])
      .put(torusKeyshareIssued({ keyshare: mockTorusKeyshare }))
      .run()
  })
  it('handleGoogleSignInCompleted: failure case', async () => {
    await expectSaga(handleGoogleSignInCompleted, googleSignInCompleted({ idToken: mockJwt }))
      .provide([
        [
          call(getTorusPrivateKey, {
            verifier: 'valora-auth0',
            jwt: mockJwt,
          }),
          throwError(new Error('(test) Error fetching Torus private key')),
        ],
      ])
      .put(keylessBackupFailed())
      .run()
  })
})
