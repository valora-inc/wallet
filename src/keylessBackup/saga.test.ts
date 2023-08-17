import { expectSaga } from 'redux-saga-test-plan'
import {
  DELAY_INTERVAL_MS,
  handleGoogleSignInCompleted,
  handleKeylessBackupSetup,
  WAIT_FOR_KEYSHARE_TIMEOUT_MS,
  waitForTorusKeyshare,
} from 'src/keylessBackup/saga'
import { call, select } from 'redux-saga/effects'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import {
  googleSignInCompleted,
  keylessBackupCompleted,
  keylessBackupFailed,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { throwError } from 'redux-saga-test-plan/providers'
import { torusKeyshareSelector } from 'src/keylessBackup/selectors'
import {
  encryptPassphrase,
  getSecp256K1KeyPair,
  getWalletAddressFromPrivateKey,
} from 'src/keylessBackup/encryption'
import { walletAddressSelector } from 'src/web3/selectors'
import { getStoredMnemonic } from 'src/backup/utils'
import { storeEncryptedMnemonic } from 'src/keylessBackup/index'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

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
      expect(ValoraAnalytics.track).toBeCalledWith('cab_torus_keyshare_timeout')
    })
  })
  describe('handleKeylessBackupSetup', () => {
    const mockTorusKeyshare = '0x123'
    const mockTorusKeyshareBuffer = Buffer.from(mockTorusKeyshare, 'hex')
    const mockValoraKeyshare = '0xabc'
    const mockValoraKeyshareBuffer = Buffer.from(mockValoraKeyshare, 'hex')

    const mockEncryptionPrivateKey =
      '0da7744e59ab530ebaa3ca5c6e67170fd18276fb1e093ba2eaa48f1d5756ffcb'
    const mockEncryptionPrivateKeyBuffer = Buffer.from(mockEncryptionPrivateKey, 'hex')
    const mockEncryptionPublicKeyBuffer = Buffer.from(
      '02e966cd1e93c10d6462e665b1a45039200e1faff289ef5265ecfbf06b5ddb94b2',
      'hex'
    )
    const mockEncryptionAddress = '0xbdde6c4f63a50b23c8bd8409fe4d9cfb33c619de'

    const mockWalletAddress = '0xdef'
    const mockMnemonic = 'fake mnemonic'
    const mockEncryptedMnemonic = 'mock-encrypted-mnemonic'

    it('stores encrypted mnemonic and puts success event if no errors', async () => {
      await expectSaga(handleKeylessBackupSetup, mockValoraKeyshare)
        .provide([
          [select(torusKeyshareSelector), mockTorusKeyshare],
          [
            call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockValoraKeyshareBuffer),
            {
              privateKey: mockEncryptionPrivateKeyBuffer,
              publicKey: mockEncryptionPublicKeyBuffer,
            },
          ],
          [
            call(getWalletAddressFromPrivateKey, mockEncryptionPrivateKeyBuffer),
            mockEncryptionAddress,
          ],
          [select(walletAddressSelector), mockWalletAddress],
          [call(getStoredMnemonic, mockWalletAddress), mockMnemonic],
          [
            call(
              encryptPassphrase,
              mockTorusKeyshareBuffer,
              mockValoraKeyshareBuffer,
              mockMnemonic
            ),
            mockEncryptedMnemonic,
          ],
          [
            call(storeEncryptedMnemonic, {
              encryptedMnemonic: mockEncryptedMnemonic,
              encryptionAddress: mockEncryptionAddress,
            }),
            undefined,
          ],
        ])
        .put(keylessBackupCompleted())
        .run()
      expect(ValoraAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_setup_success')
    })
    it('puts failure event if error occurs storing encrypted mnemonic', async () => {
      await expectSaga(handleKeylessBackupSetup, mockValoraKeyshare)
        .provide([
          [select(torusKeyshareSelector), mockTorusKeyshare],
          [
            call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockValoraKeyshareBuffer),
            {
              privateKey: mockEncryptionPrivateKeyBuffer,
              publicKey: mockEncryptionPublicKeyBuffer,
            },
          ],
          [
            call(getWalletAddressFromPrivateKey, mockEncryptionPrivateKeyBuffer),
            mockEncryptionAddress,
          ],
          [select(walletAddressSelector), mockWalletAddress],
          [call(getStoredMnemonic, mockWalletAddress), mockMnemonic],
          [
            call(
              encryptPassphrase,
              mockTorusKeyshareBuffer,
              mockValoraKeyshareBuffer,
              mockMnemonic
            ),
            mockEncryptedMnemonic,
          ],
          [
            call(storeEncryptedMnemonic, {
              encryptedMnemonic: mockEncryptedMnemonic,
              encryptionAddress: mockEncryptionAddress,
            }),
            throwError(new Error('mock error storing encrypted mnemonic')),
          ],
        ])
        .put(keylessBackupFailed())
        .run()
      expect(ValoraAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_setup_failed')
    })
  })
})
