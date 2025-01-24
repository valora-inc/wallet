import { FetchMock } from 'jest-fetch-mock/types'
import * as Keychain from 'react-native-keychain'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import {
  generateSignedMessage,
  handleUpdateAccountRegistration,
  initializeAccountSaga,
} from 'src/account/saga'
import { choseToRestoreAccountSelector } from 'src/account/selectors'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { Actions as AccountActions, phoneNumberVerificationCompleted } from 'src/app/actions'
import { inviterAddressSelector } from 'src/app/selectors'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { retrieveSignedMessage, storeSignedMessage } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { ViemKeychainAccount } from 'src/viem/keychainAccountToAccount'
import { getKeychainAccounts } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { UnlockResult, getOrCreateAccount, unlockAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { initializeAccountSuccess, saveSignedMessage } from './actions'

const loggerErrorSpy = jest.spyOn(Logger, 'error')
const mockedKeychain = jest.mocked(Keychain)

const mockFetch = fetch as FetchMock
jest.unmock('src/pincode/authentication')
jest.mock('src/analytics/AppAnalytics')

jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(() => ({
    messaging: () => ({
      getToken: jest.fn().mockResolvedValue('someToken'),
    }),
  })),
}))

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
  let mockViemAccount: ViemKeychainAccount

  beforeEach(async () => {
    jest.clearAllMocks()

    const keychainAccounts = await getKeychainAccounts()
    const viemAccount = await keychainAccounts.getViemAccount(address)
    if (!viemAccount) {
      throw new Error('No viem account found')
    }
    mockViemAccount = viemAccount
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
        [call(unlockAccount, address), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemAccount.signTypedData), 'someSignedMessage'],
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
          [call(unlockAccount, address), UnlockResult.FAILURE],
          [
            matchers.call.fn(mockViemAccount.signTypedData),
            throwError(new Error('could not generate signature')),
          ],
        ])
        .not.put(saveSignedMessage())
        .not.call(storeSignedMessage)
        .run()
    ).rejects.toThrowError('could not generate signature')
  })
})

describe('initializeAccount', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('should handle the last previously verified phone number', async () => {
    mockFetch.mockResponse(
      JSON.stringify({ data: { phoneNumbers: ['+1302123456', '+31619123456'] } })
    )
    const inviterAddress = '0xINVITER'

    await expectSaga(initializeAccountSaga)
      .provide([
        [call(getOrCreateAccount), undefined],
        [call(generateSignedMessage), undefined],
        [select(choseToRestoreAccountSelector), true],
        [call(retrieveSignedMessage), 'some signed message'],
        [select(walletAddressSelector), '0xabc'],
        [select(inviterAddressSelector), inviterAddress],
      ])
      .put(initializeAccountSuccess())
      .put(phoneNumberVerificationCompleted('+31619123456', '+31'))
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.lookupAddressUrl}?clientPlatform=android&clientVersion=0.0.1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `${networkConfig.authHeaderIssuer} 0xabc:some signed message`,
        },
      }
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.initialize_account_complete, {
      inviterAddress,
    })
  })

  it('should handle if there is no previously verified phone number', async () => {
    mockFetch.mockResponse(JSON.stringify({ data: { phoneNumbers: [] } }))

    await expectSaga(initializeAccountSaga)
      .provide([
        [call(getOrCreateAccount), undefined],
        [call(generateSignedMessage), undefined],
        [select(choseToRestoreAccountSelector), true],
        [call(retrieveSignedMessage), 'some signed message'],
        [select(walletAddressSelector), '0xabc'],
        [select(inviterAddressSelector), null],
      ])
      .put(initializeAccountSuccess())
      .not.put.actionType(AccountActions.PHONE_NUMBER_VERIFICATION_COMPLETED)
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should still initialize account if lookup address fails', async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })

    await expectSaga(initializeAccountSaga)
      .provide([
        [call(getOrCreateAccount), undefined],
        [call(generateSignedMessage), undefined],
        [select(choseToRestoreAccountSelector), true],
        [call(retrieveSignedMessage), 'some signed message'],
        [select(walletAddressSelector), '0xabc'],
        [select(inviterAddressSelector), null],
      ])
      .put(initializeAccountSuccess())
      .not.put.actionType(AccountActions.PHONE_NUMBER_VERIFICATION_COMPLETED)
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
