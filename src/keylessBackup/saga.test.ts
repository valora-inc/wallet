import { expectSaga } from 'redux-saga-test-plan'
import {
  DELAY_INTERVAL_MS,
  handleGoogleSignInCompleted,
  WAIT_FOR_KEYSHARE_TIMEOUT_MS,
  waitForTorusKeyshare,
} from 'src/keylessBackup/saga'
import { call, select } from 'redux-saga/effects'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import {
  googleSignInCompleted,
  keylessBackupFailed,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { throwError } from 'redux-saga-test-plan/providers'
import { torusKeyshareSelector } from 'src/keylessBackup/selectors'

describe('keylessBackup saga', () => {
  describe('handleGoogleSignInCompleted', () => {
    const mockJwt = 'abc.def.ghi'
    it('success case', async () => {
      const mockTorusKeyshare = 'my-torus-keyshare'
      await expectSaga(handleGoogleSignInCompleted, googleSignInCompleted({ idToken: mockJwt }))
        .provide([
          [call(getTorusPrivateKey, { verifier: 'valora-auth0', jwt: mockJwt }), mockTorusKeyshare],
        ])
        .put(torusKeyshareIssued({ keyshare: mockTorusKeyshare }))
        .run()
    })
    it('failure case', async () => {
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
  describe('waitForTorusKeyshare', () => {
    const mockDelay = jest.fn()
    const provideDelay = ({ fn }: { fn: any }, next: any) =>
      fn.name === 'delayP' ? mockDelay() : next()

    it('returns torusKeyshare if already exists', async () => {
      await expectSaga(waitForTorusKeyshare)
        .provide([[select(torusKeyshareSelector), 'my-torus-keyshare']])
        .returns('my-torus-keyshare')
        .run()
    })
    it('returns torusKeyshare if exists after delay', async () => {
      const mockSelect = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue('my-torus-keyshare')
      await expectSaga(waitForTorusKeyshare)
        .provide([
          {
            select: mockSelect,
          },
          { call: provideDelay },
        ])
        .returns('my-torus-keyshare')
        .run()
      expect(mockSelect).toHaveBeenCalledTimes(2)
    })
    it('throws if torusKeyshare does not exist after timeout', async () => {
      let mockTime = 0
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime)
      mockDelay.mockImplementation(() => {
        mockTime += DELAY_INTERVAL_MS
      })
      let caughtErrorMessage: string | null = null
      await expectSaga(waitForTorusKeyshare)
        .provide([[select(torusKeyshareSelector), undefined], { call: provideDelay }])
        .run()
        .catch((error) => {
          caughtErrorMessage = error.message
        })
      expect(mockTime).toBeGreaterThanOrEqual(WAIT_FOR_KEYSHARE_TIMEOUT_MS) // make sure the test is mocking time correctly
      expect(caughtErrorMessage).toBe('Timed out waiting for torus keyshare.')
    })
  })
  describe('handleKeylessBackupSetup', () => {
    // TODO
  })
})
