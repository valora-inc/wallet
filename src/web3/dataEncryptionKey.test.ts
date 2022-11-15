import * as DEK from '@celo/utils/lib/dataEncryptionKey'
import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { centralPhoneVerificationEnabledSelector } from 'src/app/selectors'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { doFetchDataEncryptionKey, fetchDEKDecentrally } from 'src/web3/dataEncryptionKey'
import networkConfig from 'src/web3/networkConfig'
import { dataEncryptionKeySelector, walletAddressSelector } from 'src/web3/selectors'
import { mocked } from 'ts-jest/utils'

const mockedDEK = mocked(DEK)
mockedDEK.compressedPubKey = jest.fn().mockReturnValue('publicKeyForUser')

const mockFetch = fetch as FetchMock
jest.unmock('src/pincode/authentication')

describe('doFetchDataEncryptionKey', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it("should return the user's own DEK", async () => {
    await expectSaga(doFetchDataEncryptionKey, '0xabc')
      .provide([
        [select(walletAddressSelector), '0xabC'],
        [select(dataEncryptionKeySelector), 'someDEK'],
      ])
      .returns('publicKeyForUser')
      .run()
  })

  it('should return the DEK fetched decentrally', async () => {
    await expectSaga(doFetchDataEncryptionKey, '0xabc')
      .provide([
        [select(walletAddressSelector), '0xbcd'],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(centralPhoneVerificationEnabledSelector), false],
        [call(fetchDEKDecentrally, '0xabc'), 'somePublicKeyFetchedOnChain'],
      ])
      .returns('somePublicKeyFetchedOnChain')
      .run()
  })

  it('should return the DEK fetched via getPublicDEKUrl', async () => {
    mockFetch.mockResponse(JSON.stringify({ data: { publicDataEncryptionKey: 'somePublicKey' } }))

    await expectSaga(doFetchDataEncryptionKey, '0xabc')
      .provide([
        [select(walletAddressSelector), '0xbcd'],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(centralPhoneVerificationEnabledSelector), true],
        [call(retrieveSignedMessage), 'some signed message'],
      ])
      .returns('somePublicKey')
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.getPublicDEKUrl}?address=0xbcd&clientPlatform=android&clientVersion=0.0.1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora 0xbcd:some signed message`,
        },
      }
    )
  })

  it('should return the decentrally fetched DEK if getPublicDEKUrl fails', async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })

    await expectSaga(doFetchDataEncryptionKey, '0xabc')
      .provide([
        [select(walletAddressSelector), '0xbcd'],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(centralPhoneVerificationEnabledSelector), true],
        [call(retrieveSignedMessage), 'some signed message'],
        [call(fetchDEKDecentrally, '0xabc'), 'somePublicKeyFetchedOnChain'],
      ])
      .returns('somePublicKeyFetchedOnChain')
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
