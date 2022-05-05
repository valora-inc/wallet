import * as Keychain from 'react-native-keychain'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import {
  fetchFinclusiveKyc,
  generateSignedMessage,
  handleUpdateAccountRegistration,
} from 'src/account/saga'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { getFinclusiveComplianceStatus } from 'src/in-house-liquidity'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { retrieveSignedMessage, storeSignedMessage } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { getWalletAddress, unlockAccount, UnlockResult } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockWallet } from 'test/values'
import { mocked } from 'ts-jest/utils'
import { saveSignedMessage, setFinclusiveKyc } from './actions'

const loggerErrorSpy = jest.spyOn(Logger, 'error')
const mockedKeychain = mocked(Keychain)

jest.mock('src/in-house-liquidity', () => ({
  ...(jest.requireActual('src/in-house-liquidity') as any),
  getFinclusiveComplianceStatus: jest.fn(() => Promise.resolve(2)),
}))

jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(() => ({
    messaging: () => ({
      getToken: jest.fn().mockResolvedValue('someToken'),
    }),
  })),
}))

describe('fetchFinclusiveKyc', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })
  it('calls finclusive if persona is approved but finclusive kyc is not', async () => {
    await expectSaga(fetchFinclusiveKyc)
      .provide([[call(getWalletAddress), mockAccount]])
      .put(setFinclusiveKyc(2))
      .run()
    expect(getFinclusiveComplianceStatus).toHaveBeenCalledTimes(1)
  })
})

describe('handleUpdateAccountRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls the account registration service with correct params', async () => {
    await expectSaga(handleUpdateAccountRegistration)
      .provide([
        [select(walletAddressSelector), '0xabc'],
        [call(retrieveSignedMessage), 'someSignedMessage'],
        [call(generateSignedMessage), 'someSignedMessage'],
        [select(currentLanguageSelector), 'en-US'],
        [select(userLocationDataSelector), { countryCodeAlpha2: 'US' }],
      ])
      .call(updateAccountRegistration, '0xabc', 'someSignedMessage', {
        appVersion: '0.0.1',
        language: 'en-US',
        country: 'US',
        fcmToken: 'someToken',
      })
      .run()
  })

  it('logs an error if the account registration service fails', async () => {
    await expectSaga(handleUpdateAccountRegistration)
      .provide([
        [select(walletAddressSelector), '0xabc'],
        [call(retrieveSignedMessage), 'someSignedMessage'],
        [select(currentLanguageSelector), null],
        [select(userLocationDataSelector), { countryCodeAlpha2: null }],
        [matchers.call.fn(updateAccountRegistration), throwError(new Error('some error'))],
      ])
      .call(updateAccountRegistration, '0xabc', 'someSignedMessage', {
        appVersion: '0.0.1',
        fcmToken: 'someToken',
      })
      .run()

    expect(loggerErrorSpy).toHaveBeenCalled()
  })
})

describe('generateSignedMessage', () => {
  const address = '0x3460806908173E6291960662c17592D423Fb22e5'
  const contractKit = {
    connection: {
      chainId: jest.fn(() => '12345'),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generates and saves the signed message', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      username: 'some username',
      password: 'someSignedMessage',
      service: 'some service',
      storage: 'some string',
    })

    await expectSaga(generateSignedMessage)
      .provide([
        [select(walletAddressSelector), address],
        [call(getWallet), mockWallet],
        [call(unlockAccount, address), UnlockResult.SUCCESS],
        [call(getContractKit), contractKit],
        [matchers.call.fn(mockWallet.signTypedData), 'someSignedMessage'],
        [call(storeSignedMessage, 'someSignedMessage'), undefined],
      ])
      .put(saveSignedMessage())
      .call(storeSignedMessage, 'someSignedMessage')
      .run()
  })

  it('logs an error if signed message could not be generated', async () => {
    await expect(
      expectSaga(generateSignedMessage)
        .provide([
          [select(walletAddressSelector), address],
          [call(getWallet), mockWallet],
          [call(unlockAccount, address), UnlockResult.FAILURE],
          [
            matchers.call.fn(mockWallet.signTypedData),
            throwError(new Error('could not generate signature')),
          ],
        ])
        .not.put(saveSignedMessage())
        .not.call(storeSignedMessage)
        .run()
    ).rejects.toThrowError('could not generate signature')
  })
})
