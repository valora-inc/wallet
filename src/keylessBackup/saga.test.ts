import { privateKeyToAddress } from '@celo/utils/lib/address'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { initializeAccountSaga } from 'src/account/saga'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { generateKeysFromMnemonic, getStoredMnemonic, storeMnemonic } from 'src/backup/utils'
import { walletHasBalance } from 'src/import/saga'
import {
  decryptPassphrase,
  encryptPassphrase,
  getSecp256K1KeyPair,
} from 'src/keylessBackup/encryption'
import { getEncryptedMnemonic, storeEncryptedMnemonic } from 'src/keylessBackup/index'
import {
  DELAY_INTERVAL_MS,
  WAIT_FOR_KEYSHARE_TIMEOUT_MS,
  handleGoogleSignInCompleted,
  handleValoraKeyshareIssued,
  waitForTorusKeyshare,
} from 'src/keylessBackup/saga'
import { torusKeyshareSelector } from 'src/keylessBackup/selectors'
import {
  googleSignInCompleted,
  keylessBackupBail,
  keylessBackupCompleted,
  keylessBackupFailed,
  torusKeyshareIssued,
  valoraKeyshareIssued,
} from 'src/keylessBackup/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { assignAccountFromPrivateKey } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockPrivateDEK } from 'test/values'
import { Hex } from 'viem'

describe('keylessBackup saga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_get_torus_keyshare_failed')
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

  describe('handleValoraKeyshareIssued', () => {
    const mockTorusKeyshare = '0x123'
    const mockTorusKeyshareBuffer = Buffer.from(mockTorusKeyshare, 'hex')
    const mockValoraKeyshare = '0xabc'
    const mockValoraKeyshareBuffer = Buffer.from(mockValoraKeyshare, 'hex')

    const mockEncryptionPrivateKey =
      '0da7744e59ab530ebaa3ca5c6e67170fd18276fb1e093ba2eaa48f1d5756ffcb'
    const mockEncryptionPrivateKeyHex: Hex = `0x${mockEncryptionPrivateKey}`
    const mockEncryptionPrivateKeyBuffer = Buffer.from(mockEncryptionPrivateKey, 'hex')
    const mockEncryptionPublicKeyBuffer = Buffer.from(
      '02e966cd1e93c10d6462e665b1a45039200e1faff289ef5265ecfbf06b5ddb94b2',
      'hex'
    )
    const mockEncryptionAddress = '0xbdde6c4f63a50b23c8bd8409fe4d9cfb33c619de'

    const mockWalletAddress = '0xdef'
    const mockMnemonic = 'fake mnemonic'
    const mockEncryptedMnemonic = 'mock-encrypted-mnemonic'
    const mockPrivateKey = mockPrivateDEK
    describe('setup', () => {
      it('stores encrypted mnemonic and puts success event if no errors', async () => {
        await expectSaga(handleValoraKeyshareIssued, {
          payload: { keyshare: mockValoraKeyshare, keylessBackupFlow: KeylessBackupFlow.Setup },
          type: valoraKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockValoraKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyBuffer,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
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
        expect(ValoraAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_success', {
          keylessBackupFlow: KeylessBackupFlow.Setup,
        })
      })
      it('puts failure event if error occurs storing encrypted mnemonic', async () => {
        await expectSaga(handleValoraKeyshareIssued, {
          payload: { keyshare: mockValoraKeyshare, keylessBackupFlow: KeylessBackupFlow.Setup },
          type: valoraKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockValoraKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyBuffer,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
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
        expect(ValoraAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_failed', {
          keylessBackupFlow: KeylessBackupFlow.Setup,
        })
      })
    })

    describe('restore', () => {
      it('gets encrypted mnemonic and puts success event if no errors', async () => {
        await expectSaga(handleValoraKeyshareIssued, {
          payload: { keyshare: mockValoraKeyshare, keylessBackupFlow: KeylessBackupFlow.Restore },
          type: valoraKeyshareIssued.type,
        })
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
              call(getEncryptedMnemonic, {
                encryptionPrivateKey: mockEncryptionPrivateKeyHex,
                encryptionAddress: mockEncryptionAddress,
              }),
              mockEncryptedMnemonic,
            ],
            [
              call(
                decryptPassphrase,
                mockTorusKeyshareBuffer,
                mockValoraKeyshareBuffer,
                mockEncryptedMnemonic
              ),
              mockMnemonic,
            ],
            [call(generateKeysFromMnemonic, mockMnemonic), { privateKey: mockPrivateKey }],
            [call(walletHasBalance, privateKeyToAddress(mockPrivateKey)), true],
            [call(assignAccountFromPrivateKey, mockPrivateKey, mockMnemonic), mockWalletAddress],
          ])
          .call(storeMnemonic, mockMnemonic, mockWalletAddress)
          .call(initializeAccountSaga)
          .put(keylessBackupCompleted())
          .run()
        expect(ValoraAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_success', {
          keylessBackupFlow: KeylessBackupFlow.Restore,
        })
      })
      it('bails if the user does not have a balance and chooses to exit', async () => {
        await expectSaga(handleValoraKeyshareIssued, {
          payload: { keyshare: mockValoraKeyshare, keylessBackupFlow: KeylessBackupFlow.Restore },
          type: valoraKeyshareIssued.type,
        })
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
              call(getEncryptedMnemonic, {
                encryptionPrivateKey: mockEncryptionPrivateKeyHex,
                encryptionAddress: mockEncryptionAddress,
              }),
              mockEncryptedMnemonic,
            ],
            [
              call(
                decryptPassphrase,
                mockTorusKeyshareBuffer,
                mockValoraKeyshareBuffer,
                mockEncryptedMnemonic
              ),
              mockMnemonic,
            ],
            [call(generateKeysFromMnemonic, mockMnemonic), { privateKey: mockPrivateKey }],
            [call(walletHasBalance, privateKeyToAddress(mockPrivateKey)), false],
          ])
          .dispatch(keylessBackupBail())
          .not.call(initializeAccountSaga)
          .run()
        expect(ValoraAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_success', {
          keylessBackupFlow: KeylessBackupFlow.Restore,
        })
        expect(navigate).toBeCalledWith(Screens.ImportSelect)
      })
      it('puts failure event if error occurs storing encrypted mnemonic', async () => {
        await expectSaga(handleValoraKeyshareIssued, {
          payload: { keyshare: mockValoraKeyshare, keylessBackupFlow: KeylessBackupFlow.Restore },
          type: valoraKeyshareIssued.type,
        })
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
              call(getEncryptedMnemonic, {
                encryptionPrivateKey: mockEncryptionPrivateKeyHex,
                encryptionAddress: mockEncryptionAddress,
              }),
              throwError(new Error('mock error getting encrypted mnemonic')),
            ],
          ])
          .put(keylessBackupFailed())
          .run()
        expect(ValoraAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_failed', {
          keylessBackupFlow: KeylessBackupFlow.Restore,
        })
      })
    })
  })
})
