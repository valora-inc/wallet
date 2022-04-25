import { generateKeys } from '@celo/utils/lib/account'
import { serializeSignature } from '@celo/utils/lib/signatureUtils'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import {
  fetchFinclusiveKyc,
  generateSignedMessage,
  handleUpdateAccountRegistration,
} from 'src/account/saga'
import { signedMessageSelector } from 'src/account/selectors'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { getStoredMnemonic } from 'src/backup/utils'
import { getFinclusiveComplianceStatus } from 'src/in-house-liquidity'
import Logger from 'src/utils/Logger'
import { getWalletAddress } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { mockAccount } from 'test/values'
import { saveSignedMessage, setFinclusiveKyc } from './actions'

const loggerErrorSpy = jest.spyOn(Logger, 'error')

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
    appVersion: '0.0.1',
    language: 'en-US',
    country: 'HV',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generates the signed message before calling the account registration service', async () => {
    await expectSaga(handleUpdateAccountRegistration, mockRegistrationProperties)
      .provide([
        [select(currentAccountSelector), '0xabc'],
        [select(signedMessageSelector), null],
        [call(generateSignedMessage), 'someSignedMessage'],
        [matchers.call.fn(updateAccountRegistration), undefined],
      ])
      .call(generateSignedMessage)
      .call(updateAccountRegistration, '0xabc', 'someSignedMessage', mockRegistrationProperties)
      .run()
  })

  it('calls the account registration service with existing signed message', async () => {
    await expectSaga(handleUpdateAccountRegistration, mockRegistrationProperties)
      .provide([
        [select(currentAccountSelector), '0xabc'],
        [select(signedMessageSelector), 'someSignedMessage'],
        [call(generateSignedMessage), 'someSignedMessage'],
      ])
      .not.call(generateSignedMessage)
      .call(updateAccountRegistration, '0xabc', 'someSignedMessage', mockRegistrationProperties)
      .run()
  })

  it('does not call the account registration service if signed message is missing', async () => {
    await expectSaga(handleUpdateAccountRegistration, mockRegistrationProperties)
      .provide([
        [select(currentAccountSelector), '0xabc'],
        [select(signedMessageSelector), null],
        [call(generateSignedMessage), throwError(new Error('some error'))],
      ])
      .call(generateSignedMessage)
      .not.call(updateAccountRegistration)
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
    await expectSaga(generateSignedMessage)
      .provide([
        [select(currentAccountSelector), address],
        [call(getStoredMnemonic, address), 'some phrase'],
        [matchers.call.fn(generateKeys), { privateKey }],
        [matchers.call.fn(serializeSignature), 'someSignedMessage'],
      ])
      .put(saveSignedMessage('someSignedMessage'))
      .run()
  })

  it('logs an error if signed message could not be generated', async () => {
    await expect(
      expectSaga(generateSignedMessage)
        .provide([
          [select(currentAccountSelector), address],
          [call(getStoredMnemonic, address), 'some phrase'],
          [matchers.call.fn(generateKeys), { privateKey }],
          [matchers.call.fn(serializeSignature), throwError(new Error('some signature error'))],
        ])
        .not.put(saveSignedMessage('someSignedMessage'))
        .run()
    ).rejects.toThrowError('some signature error')
  })
})
