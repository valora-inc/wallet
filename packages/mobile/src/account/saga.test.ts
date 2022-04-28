import { generateKeys } from '@celo/utils/lib/account'
import { serializeSignature } from '@celo/utils/lib/signatureUtils'
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
import { getStoredMnemonic } from 'src/backup/utils'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { getFinclusiveComplianceStatus } from 'src/in-house-liquidity'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { retrieveSignedMessage, storeSignedMessage } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { getWalletAddress } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount } from 'test/values'
import { mocked } from 'ts-jest/utils'
import { saveSignedMessage, setFinclusiveKyc } from './actions'

const loggerErrorSpy = jest.spyOn(Logger, 'error')
const mockedKeychain = mocked(Keychain)

jest.mock('src/in-house-liquidity', () => ({
  ...(jest.requireActual('src/in-house-liquidity') as any),
  getFinclusiveComplianceStatus: jest.fn(() => Promise.resolve(2)),
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
  const mockRegistrationProperties = {
    fcmToken: 'someToken',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls the account registration service with correct params', async () => {
    await expectSaga(handleUpdateAccountRegistration, mockRegistrationProperties)
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
        ...mockRegistrationProperties,
      })
      .run()
  })

  it('logs an error if the account registration service fails', async () => {
    await expectSaga(handleUpdateAccountRegistration, mockRegistrationProperties)
      .provide([
        [select(walletAddressSelector), '0xabc'],
        [call(retrieveSignedMessage), 'someSignedMessage'],
        [select(currentLanguageSelector), 'en-US'],
        [select(userLocationDataSelector), { countryCodeAlpha2: 'US' }],
        [matchers.call.fn(updateAccountRegistration), throwError(new Error('some error'))],
      ])
      .call(updateAccountRegistration, '0xabc', 'someSignedMessage', {
        appVersion: '0.0.1',
        language: 'en-US',
        country: 'US',
        ...mockRegistrationProperties,
      })
      .run()

    expect(loggerErrorSpy).toHaveBeenCalled()
  })
})

describe('generateSignedMessage', () => {
  const privateKey = 'e991433ff31ed1e2fca92bc26e6ab869a4a1119e2f8bce42d8fcd638d9f8633b'
  const address = '0x3460806908173E6291960662c17592D423Fb22e5'

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
        [call(getStoredMnemonic, address), 'some phrase'],
        [matchers.call.fn(generateKeys), { privateKey }],
        [matchers.call.fn(serializeSignature), 'someSignedMessage'],
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
          [call(getStoredMnemonic, address), 'some phrase'],
          [matchers.call.fn(generateKeys), { privateKey }],
          [matchers.call.fn(serializeSignature), throwError(new Error('some signature error'))],
        ])
        .not.put(saveSignedMessage())
        .not.call(storeSignedMessage)
        .run()
    ).rejects.toThrowError('some signature error')
  })
})
