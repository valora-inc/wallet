import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { initializeAccountSaga } from 'src/account/saga'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { generateKeysFromMnemonic, getStoredMnemonic, storeMnemonic } from 'src/backup/utils'
import { walletHasBalance } from 'src/import/saga'
import {
  decryptPassphrase,
  encryptPassphrase,
  getSecp256K1KeyPair,
} from 'src/keylessBackup/encryption'
import {
  deleteEncryptedMnemonic,
  getEncryptedMnemonic,
  storeEncryptedMnemonic,
} from 'src/keylessBackup/index'
import { getSECP256k1PrivateKey, storeSECP256k1PrivateKey } from 'src/keylessBackup/keychain'
import {
  DELAY_INTERVAL_MS,
  WAIT_FOR_KEYSHARE_TIMEOUT_MS,
  handleAppKeyshareIssued,
  handleAuth0SignInCompleted,
  handleDeleteKeylessBackup,
  waitForTorusKeyshare,
} from 'src/keylessBackup/saga'
import { torusKeyshareSelector } from 'src/keylessBackup/selectors'
import {
  appKeyshareIssued,
  auth0SignInCompleted,
  deleteKeylessBackupCompleted,
  deleteKeylessBackupFailed,
  keylessBackupBail,
  keylessBackupCompleted,
  keylessBackupFailed,
  keylessBackupNotFound,
  torusKeyshareIssued,
} from 'src/keylessBackup/slice'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { privateKeyToAddress } from 'src/utils/address'
import networkConfig from 'src/web3/networkConfig'
import { assignAccountFromPrivateKey } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockPrivateKey } from 'test/values'
import { type Hex } from 'viem'
import { generatePrivateKey } from 'viem/accounts'

jest.mock('src/keylessBackup/index')

jest.mock('src/utils/Logger')

describe('keylessBackup saga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleDeleteKeylessBackup', () => {
    it('success case', async () => {
      const privateKey = generatePrivateKey()
      await expectSaga(handleDeleteKeylessBackup)
        .provide([
          [select(walletAddressSelector), mockAccount],
          [call(getSECP256k1PrivateKey, mockAccount), privateKey],
          [call(deleteEncryptedMnemonic, privateKey), undefined],
        ])
        .put(deleteKeylessBackupCompleted())
        .run()
    })
    it('failure case', async () => {
      const privateKey = generatePrivateKey()
      await expectSaga(handleDeleteKeylessBackup)
        .provide([
          [select(walletAddressSelector), mockAccount],
          [call(getSECP256k1PrivateKey, mockAccount), privateKey],
          [
            call(deleteEncryptedMnemonic, privateKey),
            throwError(new Error('(test) Error deleting encrypted mnemonic')),
          ],
        ])
        .put(deleteKeylessBackupFailed())
        .run()
    })
  })

  describe('handleGoogleSignInCompleted', () => {
    const mockJwt = 'abc.def.ghi'
    it('success case', async () => {
      const mockTorusKeyshare = 'my-torus-keyshare'
      await expectSaga(handleAuth0SignInCompleted, auth0SignInCompleted({ idToken: mockJwt }))
        .provide([
          [
            call(getTorusPrivateKey, { verifier: networkConfig.web3AuthVerifier, jwt: mockJwt }),
            mockTorusKeyshare,
          ],
        ])
        .put(torusKeyshareIssued({ keyshare: mockTorusKeyshare }))
        .run()
    })
    it('failure case', async () => {
      await expectSaga(handleAuth0SignInCompleted, auth0SignInCompleted({ idToken: mockJwt }))
        .provide([
          [
            call(getTorusPrivateKey, {
              verifier: 'fake-verifier',
              jwt: mockJwt,
            }),
            throwError(new Error('(test) Error fetching Torus private key')),
          ],
        ])
        .put(keylessBackupFailed())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledWith('cab_get_torus_keyshare_failed')
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
      expect(AppAnalytics.track).toBeCalledWith('cab_torus_keyshare_timeout')
    })
  })

  describe('handleAppKeyshareIssued', () => {
    const mockTorusKeyshare = '0x123'
    const mockTorusKeyshareBuffer = Buffer.from(mockTorusKeyshare, 'hex')
    const mockAppKeyshare = '0xabc'
    const mockAppKeyshareBuffer = Buffer.from(mockAppKeyshare, 'hex')
    const mockJwt = 'abc.def.ghi'

    const mockEncryptionPrivateKey =
      '0da7744e59ab530ebaa3ca5c6e67170fd18276fb1e093ba2eaa48f1d5756ffcb'
    const mockEncryptionPrivateKeyHex: Hex = `0x${mockEncryptionPrivateKey}`
    const mockEncryptionPublicKeyBuffer = Buffer.from(
      '02e966cd1e93c10d6462e665b1a45039200e1faff289ef5265ecfbf06b5ddb94b2',
      'hex'
    )
    const mockEncryptionAddress = '0xbdde6c4f63a50b23c8bd8409fe4d9cfb33c619de'

    const mockWalletAddress = '0xdef'
    const mockMnemonic = 'fake mnemonic'
    const mockEncryptedMnemonic = 'mock-encrypted-mnemonic'
    describe('setup', () => {
      it('stores encrypted mnemonic and puts success event if no errors', async () => {
        await expectSaga(handleAppKeyshareIssued, {
          payload: {
            keyshare: mockAppKeyshare,
            keylessBackupFlow: KeylessBackupFlow.Setup,
            origin: KeylessBackupOrigin.Settings,
            jwt: mockJwt,
          },
          type: appKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockAppKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyHex,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
            ],
            [select(walletAddressSelector), mockWalletAddress],
            [call(getStoredMnemonic, mockWalletAddress), mockMnemonic],
            [
              call(encryptPassphrase, mockTorusKeyshareBuffer, mockAppKeyshareBuffer, mockMnemonic),
              mockEncryptedMnemonic,
            ],
            [
              call(storeEncryptedMnemonic, {
                encryptedMnemonic: mockEncryptedMnemonic,
                encryptionAddress: mockEncryptionAddress,
                jwt: mockJwt,
              }),
              undefined,
            ],
            [
              call(storeSECP256k1PrivateKey, mockEncryptionPrivateKeyHex, mockWalletAddress),
              undefined,
            ],
          ])
          .put(keylessBackupCompleted())
          .run()
        expect(AppAnalytics.track).toBeCalledWith('cab_setup_hashed_keyshares', {
          hashedKeysharePhone: 'a0b7675b466da4059cda48c116c0ead195916e045c6d4e9eff7301242b12b9e0',
          hashedKeyshareEmail: 'a8ad600b8026607f35817dc15f93a25d9fa6617fae6cfd19b3c927eb633ec331',
        })
        expect(AppAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_success', {
          keylessBackupFlow: KeylessBackupFlow.Setup,
          origin: KeylessBackupOrigin.Settings,
        })
      })
      it('puts failure event if error occurs storing encrypted mnemonic', async () => {
        await expectSaga(handleAppKeyshareIssued, {
          payload: {
            keyshare: mockAppKeyshare,
            keylessBackupFlow: KeylessBackupFlow.Setup,
            origin: KeylessBackupOrigin.Settings,
            jwt: mockJwt,
          },
          type: appKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockAppKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyHex,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
            ],
            [select(walletAddressSelector), mockWalletAddress],
            [call(getStoredMnemonic, mockWalletAddress), mockMnemonic],
            [
              call(encryptPassphrase, mockTorusKeyshareBuffer, mockAppKeyshareBuffer, mockMnemonic),
              mockEncryptedMnemonic,
            ],
            [
              call(storeEncryptedMnemonic, {
                encryptedMnemonic: mockEncryptedMnemonic,
                encryptionAddress: mockEncryptionAddress,
                jwt: mockJwt,
              }),
              throwError(new Error('mock error storing encrypted mnemonic')),
            ],
          ])
          .put(keylessBackupFailed())
          .run()
        expect(AppAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_failed', {
          keylessBackupFlow: KeylessBackupFlow.Setup,
          origin: KeylessBackupOrigin.Settings,
        })
      })
    })

    describe('restore', () => {
      it('gets encrypted mnemonic and puts success event if no errors', async () => {
        await expectSaga(handleAppKeyshareIssued, {
          payload: {
            keyshare: mockAppKeyshare,
            keylessBackupFlow: KeylessBackupFlow.Restore,
            origin: KeylessBackupOrigin.Settings,
            jwt: mockJwt,
          },
          type: appKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockAppKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyHex,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
            ],
            [call(getEncryptedMnemonic, mockEncryptionPrivateKeyHex), mockEncryptedMnemonic],
            [
              call(
                decryptPassphrase,
                mockTorusKeyshareBuffer,
                mockAppKeyshareBuffer,
                mockEncryptedMnemonic
              ),
              mockMnemonic,
            ],
            [call(generateKeysFromMnemonic, mockMnemonic), { privateKey: mockPrivateKey }],
            [call(walletHasBalance, privateKeyToAddress(mockPrivateKey)), true],
            [call(assignAccountFromPrivateKey, mockPrivateKey, mockMnemonic), mockWalletAddress],
            [
              call(storeSECP256k1PrivateKey, mockEncryptionPrivateKeyHex, mockWalletAddress),
              undefined,
            ],
          ])
          .call(storeMnemonic, mockMnemonic, mockWalletAddress)
          .call(initializeAccountSaga)
          .put(keylessBackupCompleted())
          .run()
        expect(Logger.info).toHaveBeenCalledWith(
          'keylessBackup/saga',
          'Phone keyshare: a0b7675b466da4059cda48c116c0ead195916e045c6d4e9eff7301242b12b9e0, Email keyshare: a8ad600b8026607f35817dc15f93a25d9fa6617fae6cfd19b3c927eb633ec331'
        )
        expect(AppAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_success', {
          keylessBackupFlow: KeylessBackupFlow.Restore,
          origin: KeylessBackupOrigin.Settings,
        })
      })
      it('bails if the user does not have a balance and chooses to exit', async () => {
        await expectSaga(handleAppKeyshareIssued, {
          payload: {
            keyshare: mockAppKeyshare,
            keylessBackupFlow: KeylessBackupFlow.Restore,
            origin: KeylessBackupOrigin.Settings,
            jwt: mockJwt,
          },
          type: appKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockAppKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyHex,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
            ],
            [call(getEncryptedMnemonic, mockEncryptionPrivateKeyHex), mockEncryptedMnemonic],
            [
              call(
                decryptPassphrase,
                mockTorusKeyshareBuffer,
                mockAppKeyshareBuffer,
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
        expect(AppAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_success', {
          keylessBackupFlow: KeylessBackupFlow.Restore,
          origin: KeylessBackupOrigin.Settings,
        })
        expect(navigate).toBeCalledWith(Screens.ImportSelect)
      })
      it('puts failure event if error occurs storing encrypted mnemonic', async () => {
        await expectSaga(handleAppKeyshareIssued, {
          payload: {
            keyshare: mockAppKeyshare,
            keylessBackupFlow: KeylessBackupFlow.Restore,
            origin: KeylessBackupOrigin.Settings,
            jwt: mockJwt,
          },
          type: appKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockAppKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyHex,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
            ],
            [
              call(getEncryptedMnemonic, mockEncryptionPrivateKeyHex),
              throwError(new Error('mock error getting encrypted mnemonic')),
            ],
          ])
          .put(keylessBackupFailed())
          .run()
        expect(AppAnalytics.track).toBeCalledWith('cab_handle_keyless_backup_failed', {
          keylessBackupFlow: KeylessBackupFlow.Restore,
          origin: KeylessBackupOrigin.Settings,
        })
      })
      it('puts not found event if encrypted mnemonic not found', async () => {
        await expectSaga(handleAppKeyshareIssued, {
          payload: {
            keyshare: mockAppKeyshare,
            keylessBackupFlow: KeylessBackupFlow.Restore,
            origin: KeylessBackupOrigin.Settings,
            jwt: mockJwt,
          },
          type: appKeyshareIssued.type,
        })
          .provide([
            [select(torusKeyshareSelector), mockTorusKeyshare],
            [
              call(getSecp256K1KeyPair, mockTorusKeyshareBuffer, mockAppKeyshareBuffer),
              {
                privateKey: mockEncryptionPrivateKeyHex,
                publicKey: mockEncryptionPublicKeyBuffer,
              },
            ],
            [call(getEncryptedMnemonic, mockEncryptionPrivateKeyHex), null],
          ])
          .put(keylessBackupNotFound())
          .run()
        expect(AppAnalytics.track).toBeCalledWith('cab_restore_mnemonic_not_found')
      })
    })
  })
})
